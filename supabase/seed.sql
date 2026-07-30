-- Insert Departments if they do not exist
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

-- Dummy Seed Data for testing
DO $$
DECLARE
  student1_id UUID;
  staff1_id UUID;
  dept1_id UUID;
  dept2_id UUID;
  complaint1_id UUID;
  complaint2_id UUID;
  complaint3_id UUID;
  complaint4_id UUID;
  complaint5_id UUID;
BEGIN
  -- We assume standard Supabase setup. If auth.users isn't seeded, we can simulate profile creation.
  -- Here we manually insert dummy users directly into profiles for demo purposes 
  -- (assuming FK constraints to auth.users are temporarily deferred or it's a test environment)
  
  -- Create dummy profiles (Requires removing auth.users FK for standalone testing, 
  -- or running this AFTER auth users are created via UI)
  
  -- Alternatively, inserting valid raw UUIDs and assuming users are signed up
  student1_id := gen_random_uuid();
  staff1_id := gen_random_uuid();

  -- Get departments
  SELECT id INTO dept1_id FROM public.departments WHERE name = 'Hostel Management' LIMIT 1;
  SELECT id INTO dept2_id FROM public.departments WHERE name = 'IT/Network' LIMIT 1;

  -- Insert dummy complaints
  -- Complaint 1: Submitted
  INSERT INTO public.complaints (id, title, description, category, priority, status, student_id, assigned_dept_id, building, room_number)
  VALUES (gen_random_uuid(), 'Broken Window in Hostel A', 'The glass window in my room is broken and cold wind is coming in.', 'hostel', 'medium', 'submitted', student1_id, dept1_id, 'Hostel A', '101') RETURNING id INTO complaint1_id;

  -- Complaint 2: In Progress
  INSERT INTO public.complaints (id, title, description, category, priority, status, student_id, assigned_dept_id, assigned_staff_id, building, room_number)
  VALUES (gen_random_uuid(), 'Wi-Fi not working', 'The internet has been down since morning.', 'internet', 'high', 'in_progress', student1_id, dept2_id, staff1_id, 'Academic Block B', 'Lab 2') RETURNING id INTO complaint2_id;

  -- Complaint 3: Resolved
  INSERT INTO public.complaints (id, title, description, category, priority, status, student_id, assigned_dept_id, building, room_number, resolved_at)
  VALUES (gen_random_uuid(), 'Leaking Tap in washroom', 'Water is continuously dripping.', 'water', 'low', 'resolved', student1_id, dept1_id, 'Hostel B', 'Washroom 3', NOW() - INTERVAL '1 day') RETURNING id INTO complaint3_id;

  -- Complaint 4: Closed
  INSERT INTO public.complaints (id, title, description, category, priority, status, student_id, assigned_dept_id, building, room_number, closed_at)
  VALUES (gen_random_uuid(), 'Fan making loud noise', 'Ceiling fan is very noisy.', 'electricity', 'medium', 'closed', student1_id, dept1_id, 'Classroom Building', 'Room 304', NOW() - INTERVAL '2 days') RETURNING id INTO complaint4_id;

  -- Complaint 5: Escalated
  INSERT INTO public.complaints (id, title, description, category, priority, status, student_id, assigned_dept_id, building, room_number, is_escalated, escalated_at)
  VALUES (gen_random_uuid(), 'No drinking water in Mess', 'The RO plant is completely shut down.', 'mess', 'critical', 'assigned', student1_id, dept1_id, 'Main Mess', 'Dining Hall', true, NOW()) RETURNING id INTO complaint5_id;

  -- Insert logs
  INSERT INTO public.complaint_logs (complaint_id, user_id, action, new_value, comment)
  VALUES 
    (complaint1_id, student1_id, 'status_change', 'submitted', 'Complaint registered.'),
    (complaint2_id, student1_id, 'status_change', 'submitted', 'Complaint registered.'),
    (complaint2_id, staff1_id, 'status_change', 'in_progress', 'Started working on the switch replacement.');

END $$;
