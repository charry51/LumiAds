'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, ExternalLink, ArrowRight, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface PlanManagerProps {
    planName: string | null;
    isSubscribed: boolean;
}

export function PlanManager({ planName, isSubscribed }: PlanManagerProps) {
    const [isManaging, setIsManaging] = useState(false)

    const currentPlan = planName || 'Sin Plan Activo'

    const handleManageSubscription = async () => {
        setIsManaging(true)
        try {
            const response = await fetch('/api/stripe/billing-portal', {
                method: 'POST',
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || 'Error al acceder al portal de pagos')
            }

            const data = await response.json()
            if (data.warning) {
                toast.warning(data.warning)
            }
            window.open(data.url, '_blank')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsManaging(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Plan Actual</p>
                        <p className="text-lg font-heading font-black text-white uppercase">{currentPlan}</p>
                    </div>
                </div>
                {!isSubscribed && planName && (
                    <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20 uppercase">
                        Cancelado / Expirado
                    </span>
                )}
                {isSubscribed && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 uppercase">
                        Activo
                    </span>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {!isSubscribed ? (
                  <Link href="/dashboard/planes" className="flex-1" target="_blank">
                        <Button className="w-full gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90">
                            Explorar Planes
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                ) : (
                    <>
                      <Link href="/dashboard/planes" className="flex-1" target="_blank">
                            <Button variant="outline" className="w-full gap-2 hover:bg-white/5 border-zinc-800 text-white">
                                Cambiar Plan
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Button 
                            className="flex-1 gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90"
                            onClick={handleManageSubscription}
                            disabled={isManaging}
                        >
                            {isManaging ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                            Portal de Facturación
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
