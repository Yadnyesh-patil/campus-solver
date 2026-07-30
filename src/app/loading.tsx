import { UpdateIcon } from '@radix-ui/react-icons';

export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-[#F7F6F3] flex flex-col items-center justify-center p-6 text-[#111111]">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <UpdateIcon className="w-8 h-8 animate-spin text-gray-400" />
        <p className="text-sm font-medium tracking-wide text-gray-500 uppercase">
          Campus Solver
        </p>
      </div>
    </div>
  );
}
