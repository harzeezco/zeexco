import { Alert, AlertDescription } from "@/components/ui/alert";

export function FormFeedback({ message }: { message: string }) {
  return <Alert variant="destructive" className="border-[#f3b8aa] bg-[#fff2ee] text-[#9f2d16]"><AlertDescription>{message}</AlertDescription></Alert>;
}
