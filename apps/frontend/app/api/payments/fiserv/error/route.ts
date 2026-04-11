import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // Fiserv envía los datos del error como un formulario (x-www-form-urlencoded)
        const formData = await request.formData();

        // Convertimos esos datos a query parameters para la URL
        const searchParams = new URLSearchParams();
        for (const [key, value] of formData.entries()) {
            searchParams.append(key, value.toString());
        }

        // Registramos en consola para poder debugear fácilmente
        console.log('🔴 FISERV REJECTED PAYMENT:');
        for (const [key, value] of formData.entries()) {
            console.log(`- ${key}: ${value}`);
        }

        // Notificar al backend de NestJS sobre el pago declinado para que envíe email y actualice estado
        const failReason = formData.get('failReason') || formData.get('fail_reason');
        const responseCode = formData.get('response_code');
        const oid = formData.get('oid') || formData.get('merchantTransactionId');

        if (oid) {
            try {
                const apiBaseUrl = process.env.API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
                await fetch(`${apiBaseUrl}/api/payments/fiserv/notification/declined`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        oid: oid.toString(),
                        failReason: failReason?.toString(),
                        responseCode: responseCode?.toString(),
                    })
                });
            } catch (notifyErr) {
                console.error('Error notificando declinado al backend:', notifyErr);
            }
        }

        // Redirigimos a la página de error visual, inyectando todos los motivos de Fiserv en la URL
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
        return NextResponse.redirect(`${baseUrl}/donar/error?${searchParams.toString()}`, 303);
    } catch (error) {
        console.error('Error procesando el retorno de Fiserv:', error);
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
        return NextResponse.redirect(`${baseUrl}/donar/error?failReason=UnknownError`, 303);
    }
}
