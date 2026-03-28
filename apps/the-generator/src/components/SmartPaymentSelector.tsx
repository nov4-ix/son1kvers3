import React, { useState, useEffect } from 'react';
import { CreditCard, Globe, Check, Star } from 'lucide-react';
import { PayPalButtons, PayPalScriptProvider, ReactPayPalScriptOptions } from '@paypal/react-paypal-js';

interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    features: string[];
    stripePriceId: string | null;
    paypalPlanId: string | null;
    popular: boolean;
}

const SmartPaymentSelector = () => {
    const [userLocation, setUserLocation] = useState({ country: 'US', region: 'North America' });
    const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal'>('stripe');
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const detectLocation = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();

                const isLatam = ['MX', 'BR', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'DO', 'HT'].includes(data.country_code);

                setUserLocation({
                    country: data.country_code || 'US',
                    region: isLatam ? 'Latin America' : (data.continent_code || 'North America')
                });

                if (isLatam) {
                    setSelectedMethod('paypal');
                }
            } catch (error) {
                console.log('Using default location');
            }
        };

        detectLocation();
    }, []);

    const plans: Plan[] = [
        {
            id: 'free',
            name: 'Free',
            price: 0,
            currency: 'USD',
            features: [
                '10 generaciones/mes',
                'Calidad estándar',
                'Marca de agua',
                'Uso personal'
            ],
            stripePriceId: null,
            paypalPlanId: null,
            popular: false
        },
        {
            id: 'basic',
            name: 'Basic',
            price: 9.99,
            currency: 'USD',
            features: [
                '100 generaciones/mes',
                'Calidad HD',
                'Sin marca de agua',
                'Descarga MP3/WAV',
                'Uso personal'
            ],
            stripePriceId: import.meta.env.VITE_STRIPE_PRICE_BASIC || 'price_basic_xxx',
            paypalPlanId: import.meta.env.VITE_PAYPAL_PLAN_BASIC || 'P-BASIC-XXX',
            popular: true
        },
        {
            id: 'pro',
            name: 'Pro',
            price: 29.99,
            currency: 'USD',
            features: [
                '500 generaciones/mes',
                'Calidad HD + stems',
                'Sin marca de agua',
                'Todos los formatos',
                'Uso comercial',
                'Soporte prioritario'
            ],
            stripePriceId: import.meta.env.VITE_STRIPE_PRICE_PRO || 'price_pro_xxx',
            paypalPlanId: import.meta.env.VITE_PAYPAL_PLAN_PRO || 'P-PRO-XXX',
            popular: false
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: 99.99,
            currency: 'USD',
            features: [
                'Generaciones ilimitadas',
                'Calidad máxima + stems',
                'Sin marca de agua',
                'API access',
                'Uso comercial',
                'White label',
                'Soporte 24/7',
                'Consultoría incluida'
            ],
            stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || 'price_enterprise_xxx',
            paypalPlanId: import.meta.env.VITE_PAYPAL_PLAN_ENTERPRISE || 'P-ENTERPRISE-XXX',
            popular: false
        }
    ];

    const paymentMethods = [
        {
            id: 'stripe' as const,
            name: 'Tarjeta de Crédito',
            icon: <CreditCard className="w-5 h-5" />,
            fee: '2.9%',
            description: 'Visa, Mastercard, Amex, Apple Pay',
            recommended: userLocation.region !== 'Latin America',
            color: 'blue'
        },
        {
            id: 'paypal' as const,
            name: 'PayPal',
            icon: (
                <div className="flex items-center text-sm font-bold">
                    <span className="text-blue-500">Pay</span>
                    <span className="text-blue-700">Pal</span>
                </div>
            ),
            fee: '3.5%',
            description: 'Cuenta PayPal, tarjeta, saldo',
            recommended: userLocation.region === 'Latin America',
            color: 'yellow'
        }
    ];

    const handleStripeSubscribe = async (plan: Plan) => {
        if (!plan.stripePriceId) return;

        setLoading(true);
        setSelectedPlan(plan.id);

        try {
            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: plan.stripePriceId }),
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Error iniciando checkout');
            }
        } catch (error) {
            console.error(error);
            alert('Error al procesar el pago con Stripe.');
        } finally {
            setLoading(false);
            setSelectedPlan(null);
        }
    };

    const handlePayPalApprove = async (data: any) => {
        const subscriptionID = data.subscriptionID;
        console.log('PayPal Subscription Approved:', subscriptionID);
        window.location.href = '/dashboard?paypal_success=true&subscription_id=' + subscriptionID;
    };

    const initialPayPalOptions: ReactPayPalScriptOptions = {
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb",
        vault: true,
        intent: 'subscription',
    };

    return (
        <div className="min-h-screen bg-transparent text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">
                            Detectado: {userLocation.country} • {userLocation.region}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Elige tu plan ideal
                    </h1>
                    <p className="text-xl text-gray-300">
                        Democratizando la creación musical con IA 🎵
                    </p>
                </div>

                <div className="max-w-2xl mx-auto mb-12">
                    <h2 className="text-center text-lg font-semibold mb-4 text-gray-300">
                        Selecciona tu método de pago preferido
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {paymentMethods.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setSelectedMethod(method.id)}
                                className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${selectedMethod === method.id
                                    ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/50'
                                    : 'border-gray-600 bg-white/5 hover:border-gray-500'
                                    }`}
                            >
                                {method.recommended && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-10 w-max">
                                        <Star className="w-3 h-3" />
                                        Recomendado para tu región
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        {method.icon}
                                        <span className="font-semibold text-lg">{method.name}</span>
                                    </div>
                                    {selectedMethod === method.id && (
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm text-gray-400 mb-2">{method.description}</p>
                                <p className="text-xs text-gray-500">Comisión: {method.fee}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <PayPalScriptProvider options={initialPayPalOptions}>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col ${plan.popular
                                    ? 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 border-2 border-blue-500 shadow-2xl shadow-blue-500/30 scale-105 z-10'
                                    : 'bg-white/5 border border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                        🔥 Más Popular
                                    </div>
                                )}

                                <div className="text-center mb-6 mt-2">
                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-bold">
                                            ${plan.price}
                                        </span>
                                        <span className="text-gray-400">/mes</span>
                                    </div>
                                </div>

                                <ul className="space-y-3 mb-8 flex-grow">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-auto">
                                    {selectedMethod === 'stripe' ? (
                                        <button
                                            onClick={() => handleStripeSubscribe(plan)}
                                            disabled={loading || (!plan.stripePriceId && !plan.price)}
                                            className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${plan.popular
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg'
                                                : plan.stripePriceId
                                                    ? 'bg-white/10 hover:bg-white/20 border border-white/20'
                                                    : 'bg-gray-700 cursor-not-allowed'
                                                } ${loading && selectedPlan === plan.id ? 'opacity-50' : ''}`}
                                        >
                                            {loading && selectedPlan === plan.id ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Procesando...
                                                </span>
                                            ) : plan.stripePriceId ? (
                                                'Suscribirme'
                                            ) : (
                                                'Plan Actual'
                                            )}
                                        </button>
                                    ) : plan.paypalPlanId ? (
                                        <div className="w-full relative z-0">
                                            <PayPalButtons
                                                createSubscription={(data, actions) => {
                                                    return actions.subscription.create({
                                                        plan_id: plan.paypalPlanId!,
                                                    });
                                                }}
                                                onApprove={handlePayPalApprove}
                                                style={{
                                                    layout: 'horizontal',
                                                    color: 'gold',
                                                    shape: 'rect',
                                                    label: 'subscribe',
                                                    height: 48,
                                                    tagline: false
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full py-3 rounded-lg font-semibold bg-gray-700 cursor-not-allowed"
                                        >
                                            No disponible
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </PayPalScriptProvider>

                <div className="text-center">
                    <p className="text-gray-400 mb-4 flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Pago 100% seguro y encriptado
                    </p>

                    <div className="flex justify-center gap-8 items-center text-gray-500 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">S</div>
                            <span>Stripe</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-lg font-bold">
                                <span className="text-blue-400">Pay</span>
                                <span className="text-blue-600">Pal</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>SSL</span>
                        </div>
                    </div>
                </div>

                <div className="mt-16 max-w-3xl mx-auto">
                    <h3 className="text-2xl font-bold text-center mb-8">Preguntas Frecuentes</h3>
                    <div className="space-y-4">
                        <details className="bg-white/5 rounded-lg p-4 border border-gray-700">
                            <summary className="cursor-pointer font-semibold">¿Puedo cancelar en cualquier momento?</summary>
                            <p className="mt-2 text-gray-400 text-sm">
                                Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de control.
                                No hay cargos de cancelación y mantendrás acceso hasta el final de tu período de pago.
                            </p>
                        </details>

                        <details className="bg-white/5 rounded-lg p-4 border border-gray-700">
                            <summary className="cursor-pointer font-semibold">¿Qué método de pago debo elegir?</summary>
                            <p className="mt-2 text-gray-400 text-sm">
                                Recomendamos PayPal para usuarios de Latinoamérica por su facilidad de uso y opciones de pago locales.
                                Para otros países, Stripe ofrece una experiencia más fluida y menores comisiones.
                            </p>
                        </details>

                        <details className="bg-white/5 rounded-lg p-4 border border-gray-700">
                            <summary className="cursor-pointer font-semibold">¿Los créditos se acumulan?</summary>
                            <p className="mt-2 text-gray-400 text-sm">
                                No, los créditos de generación se resetean cada mes. Diseñamos esto para mantener precios accesibles
                                y permitirte siempre tener acceso a tus generaciones mensuales sin preocuparte por perder créditos antiguos.
                            </p>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartPaymentSelector;
