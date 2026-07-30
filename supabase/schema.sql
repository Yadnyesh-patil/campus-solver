-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'staff', 'admin')) DEFAULT 'student',
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. departments
CREATE TABLE public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  head_user_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. complaints
CREATE TABLE public.complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hostel', 'electricity', 'water', 'internet', 'transport', 'mess', 'library', 'classroom', 'faculty', 'examination', 'sports', 'medical', 'security', 'other')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('submitted', 'verified', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected')) DEFAULT 'submitted',
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  assigned_dept_id UUID REFERENCES public.departments(id),
  assigned_staff_id UUID REFERENCES public.profiles(id),
  building TEXT NOT NULL,
  room_number TEXT,
  ai_category TEXT,
  ai_priority TEXT,
  ai_summary TEXT,
  ai_sentiment_score REAL,
  ai_metadata JSONB DEFAULT '{}',
  image_urls TEXT[] DEFAULT '{}',
  sla_deadline TIMESTAMPTZ,
  is_escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  closed_by_student BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. complaint_logs
CREATE TABLE public.complaint_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL CHECK (action IN ('status_change', 'comment', 'assignment', 'escalation', 'closed_by_student')),
  old_value TEXT,
  new_value TEXT,
  comment TEXT,
  attachment_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. notifications
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('status_update', 'assignment', 'escalation', 'sla_warning', 'closed')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- profiles
CREATE POLICY "Students can read their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id AND role = 'student');
CREATE POLICY "Staff can read profiles in their department" ON public.profiles FOR SELECT USING (
  role = 'staff' AND department = (SELECT department FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- complaints
CREATE POLICY "Students can read their own complaints" ON public.complaints FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can insert complaints" ON public.complaints FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Staff can read complaints assigned to them" ON public.complaints FOR SELECT USING (
  assigned_staff_id = auth.uid() OR
  assigned_dept_id IN (
    SELECT d.id FROM public.departments d 
    JOIN public.profiles p ON p.department = d.name 
    WHERE p.id = auth.uid()
  )
);
CREATE POLICY "Admins can read all complaints" ON public.complaints FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all complaints" ON public.complaints FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Staff can update complaints assigned to them" ON public.complaints FOR UPDATE USING (
  assigned_staff_id = auth.uid()
);

-- complaint_logs
CREATE POLICY "Users can read logs for complaints they have access to" ON public.complaint_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.complaints c 
    WHERE c.id = complaint_id AND (
      c.student_id = auth.uid() OR 
      c.assigned_staff_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  )
);
CREATE POLICY "Users can insert logs for complaints they are involved in" ON public.complaint_logs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.complaints c 
    WHERE c.id = complaint_id AND (
      c.student_id = auth.uid() OR 
      c.assigned_staff_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  )
);

-- notifications
CREATE POLICY "Users can only read their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());


-- Indexes
CREATE INDEX idx_complaints_student_id ON public.complaints(student_id);
CREATE INDEX idx_complaints_assigned_staff_id ON public.complaints(assigned_staff_id);
CREATE INDEX idx_complaints_assigned_dept_id ON public.complaints(assigned_dept_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_created_at_desc ON public.complaints(created_at DESC);
CREATE INDEX idx_complaints_is_escalated ON public.complaints(is_escalated) WHERE is_escalated = true;
CREATE INDEX idx_complaint_logs_complaint_id ON public.complaint_logs(complaint_id);
CREATE INDEX idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);


-- Triggers

-- Auto-update trigger for complaints
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Seed Data (Departments)
DO $$
BEGIN
  INSERT INTO public.departments (name, description) VALUES
    ('Hostel Management', 'Handles issues related to hostel rooms, cleanliness, and facilities.'),
    ('Electrical Maintenance', 'Handles electricity, wiring, appliances, and lighting issues.'),
    ('Water Supply', 'Handles plumbing, drinking water, and washroom water supply.'),
    ('IT/Network', 'Handles Wi-Fi, internet connectivity, and campus IT infrastructure.'),
    ('Transport', 'Handles campus buses and transport facilities.'),
    ('Mess/Canteen', 'Handles food quality, hygiene, and catering issues.'),
    ('Library', 'Handles library resources, seating, and facility issues.'),
    ('Classroom Maintenance', 'Handles classroom furniture, boards, and general maintenance.'),
    ('Medical', 'Handles campus clinic and medical emergencies.'),
    ('Security', 'Handles campus security, entry/exit, and safety concerns.'),
    ('General Administration', 'Handles all other administrative issues.')
  ON CONFLICT (name) DO NOTHING;
END $$;
