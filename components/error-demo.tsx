"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ErrorDemo() {
  const { toast, error, success, warning, info } = useToast()
  const [throwError, setThrowError] = useState(false)

  if (throwError) {
    throw new Error("This is a test error from the Error Boundary component")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Handling Demo</CardTitle>
        <CardDescription>Test different error handling patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() =>
              error({
                title: "Error Toast",
                description: "This is an error toast notification",
              })
            }
            variant="destructive"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Show Error Toast
          </Button>

          <Button
            onClick={() =>
              success({
                title: "Success Toast",
                description: "This is a success toast notification",
              })
            }
            variant="outline"
            className="border-green-500 text-green-500"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Show Success Toast
          </Button>

          <Button
            onClick={() =>
              warning({
                title: "Warning Toast",
                description: "This is a warning toast notification",
              })
            }
            variant="outline"
            className="border-yellow-500 text-yellow-500"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Show Warning Toast
          </Button>

          <Button
            onClick={() =>
              info({
                title: "Info Toast",
                description: "This is an info toast notification",
              })
            }
            variant="outline"
            className="border-blue-500 text-blue-500"
          >
            <Info className="h-4 w-4 mr-2" />
            Show Info Toast
          </Button>
        </div>

        <div className="pt-4 border-t">
          <Button onClick={() => setThrowError(true)} variant="destructive" className="w-full">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Trigger Error Boundary
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
