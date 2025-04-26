"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Info, Clock, TrendingUp, AlertCircle } from "lucide-react"
import { useTheme } from "next-themes"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { ErrorAlert } from "@/components/ui/error-alert"
import { LoadingButton } from "@/components/ui/loading-button"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { stakeMVN, resetStakingError } from "@/lib/redux/slices/stakingSlice"

interface StakeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StakeModal({ isOpen, onClose }: StakeModalProps) {
  const { resolvedTheme } = useTheme()
  const { error: showError, success: showSuccess } = useToast()
  const isDark = resolvedTheme === "dark"
  const [amount, setAmount] = useState<string>("")
  const [period, setPeriod] = useState<number>(1) // Default to 1 month
  const [baseAPR, setBaseAPR] = useState<number>(5) // Base APR percentage
  const [totalAPR, setTotalAPR] = useState<number>(6) // Base + period bonus
  const [formError, setFormError] = useState<string>("")

  const dispatch = useAppDispatch()
  const { availableMVN, error: stakingError, isStaking } = useAppSelector((state) => state.staking)

  // Calculate total APR based on period
  useEffect(() => {
    setTotalAPR(baseAPR + period)
  }, [period, baseAPR])

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setAmount("")
      setPeriod(1)
      setFormError("")
      dispatch(resetStakingError())
    }
  }, [isOpen, dispatch])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setFormError("")
    }
  }

  const handleMaxClick = () => {
    setAmount(availableMVN.toString())
    setFormError("")
  }

  const handlePeriodChange = (value: number[]) => {
    setPeriod(value[0])
  }

  const validateForm = (): boolean => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setFormError("Please enter a valid amount")
      return false
    }

    if (Number.parseFloat(amount) > availableMVN) {
      setFormError("Amount exceeds available balance")
      return false
    }

    return true
  }

  const handleStake = async () => {
    // Clear previous errors
    setFormError("")
    dispatch(resetStakingError())

    // Validate form
    if (!validateForm()) return

    try {
      // Dispatch stake action
      const resultAction = await dispatch(
        stakeMVN({
          amount: Number.parseFloat(amount),
          period,
        }),
      ).unwrap()

      // Success
      showSuccess({
        title: "Staking Successful",
        description: `You have successfully staked ${amount} MVN for ${period} ${period === 1 ? "month" : "months"}.`,
      })

      // Reset form and close modal
      setAmount("")
      setPeriod(1)
      onClose()
    } catch (err) {
      // Error is handled in the component via the stakingError state
      showError({
        title: "Staking Failed",
        description: err instanceof Error ? err.message : "An unknown error occurred",
      })
    }
  }

  // Get period label
  const getPeriodLabel = (months: number) => {
    return months === 1 ? "1 month" : `${months} months`
  }

  // Get period options
  const periodOptions = [1, 3, 6, 12, 24]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={`relative w-full sm:max-w-lg max-h-[90vh] overflow-auto rounded-xl ${
              isDark ? "bg-gray-900" : "bg-white"
            } shadow-xl`}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${
                isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"
              }`}
            >
              <h2 className="text-xl font-bold">Stake MVN</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Network Error Alert */}
              {stakingError && <ErrorAlert message={stakingError} />}

              {/* Available Balance */}
              <div className={`p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Available MVN</span>
                  <span className="font-bold">{availableMVN.toLocaleString()} MVN</span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="stake-amount" className="flex items-center justify-between">
                  <span>Amount to Stake</span>
                </Label>
                <div className="relative">
                  <Input
                    id="stake-amount"
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    className={`pr-16 ${formError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    placeholder="0.00"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 text-blue-500"
                    onClick={handleMaxClick}
                  >
                    MAX
                  </Button>
                </div>

                {/* Form Error */}
                {formError && (
                  <div className="flex items-center text-xs text-red-500 mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {formError}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {Number.parseFloat(amount) > 0 ? `≈ $${(Number.parseFloat(amount) * 1.25).toFixed(2)}` : ""}
                  </span>
                </div>
              </div>

              {/* Staking Period */}
              <div className="space-y-4">
                <Label className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                  Staking Period
                </Label>

                <div className="space-y-6">
                  <div className="flex justify-between">
                    {periodOptions.map((months) => (
                      <Button
                        key={months}
                        variant={period === months ? "default" : "outline"}
                        size="sm"
                        className={period === months ? "bg-blue-500 hover:bg-blue-600" : ""}
                        onClick={() => setPeriod(months)}
                      >
                        {getPeriodLabel(months)}
                      </Button>
                    ))}
                  </div>

                  <Slider
                    value={[period]}
                    min={1}
                    max={24}
                    step={1}
                    onValueChange={handlePeriodChange}
                    className="mt-2"
                  />

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 month</span>
                    <span>24 months</span>
                  </div>
                </div>
              </div>

              {/* APR Information */}
              <div className={`p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                  <span className="font-medium">Estimated APR</span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Base APR</span>
                  <span className="font-medium">{baseAPR}%</span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Period Bonus</span>
                  <span className="font-medium text-green-500">+{period}%</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                  <span className="font-medium">Total APR</span>
                  <span className="font-bold text-green-500">{totalAPR}%</span>
                </div>
              </div>

              {/* Staking Summary */}
              {amount && Number.parseFloat(amount) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg ${isDark ? "bg-blue-900/20" : "bg-blue-50"} border ${
                    isDark ? "border-blue-800" : "border-blue-100"
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Info className="h-5 w-5 mr-2 text-blue-500" />
                    <span className="font-medium">Staking Summary</span>
                  </div>

                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Amount</span>
                      <span className="font-medium">{Number.parseFloat(amount).toLocaleString()} MVN</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Lock Period</span>
                      <span className="font-medium">{getPeriodLabel(period)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Unlock Date</span>
                      <span className="font-medium">
                        {new Date(Date.now() + period * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-blue-800/30">
                      <span className="font-medium">Estimated Rewards</span>
                      <span className="font-bold text-blue-500">
                        +{((Number.parseFloat(amount) * totalAPR * period) / (12 * 100)).toFixed(2)} MVN
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Disclaimer */}
              <div className="text-xs text-gray-500">
                <p>
                  By staking your MVN tokens, you agree to lock them for the selected period. Early unstaking may result
                  in penalties. Rewards are distributed monthly.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div
              className={`sticky bottom-0 z-10 p-4 border-t ${
                isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"
              }`}
            >
              <LoadingButton
                className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600"
                disabled={
                  !amount || Number.parseFloat(amount) <= 0 || Number.parseFloat(amount) > availableMVN || isStaking
                }
                onClick={handleStake}
                loading={isStaking}
                loadingText="Staking..."
              >
                Stake MVN
              </LoadingButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
