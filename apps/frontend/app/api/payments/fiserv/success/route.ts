import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const searchParams = new URLSearchParams();

        for (const [key, value] of formData.entries()) {
            searchParams.append(key, value.toString());
        }

        console.log('✅ FISERV SUCCESSFUL PAYMENT:');
        for (const [key, value] of formData.entries()) {
            console.log(`- ${key}: ${value}`);
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
        return NextResponse.redirect(`${baseUrl}/donar/success?${searchParams.toString()}`, 303);
    } catch (error) {
        console.error('Error procesando el retorno de Fiserv:', error);
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
        return NextResponse.redirect(`${baseUrl}/donar/success`, 303);
    }
}
