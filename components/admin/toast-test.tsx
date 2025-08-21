'use client'

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function ToastTest() {
  return (
    <div className="flex gap-2">
      <Button 
        onClick={() => toast.success("Success! Sonner is working perfectly!")}
        variant="default"
        size="sm"
      >
        Test Success Toast
      </Button>
      <Button 
        onClick={() => toast.error("Error! This is a test error message.")}
        variant="destructive"
        size="sm"
      >
        Test Error Toast
      </Button>
      <Button 
        onClick={() => toast.info("Info! This is an informational message.")}
        variant="outline"
        size="sm"
      >
        Test Info Toast
      </Button>
    </div>
  )
}
