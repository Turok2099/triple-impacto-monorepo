# 🔗 Integración de Sanity CMS con Next.js

Guía completa para consumir los datos del CMS desde tu aplicación Next.js.

## 📦 Instalación en el Frontend

```bash
cd apps/frontend
npm install @sanity/client @sanity/image-url
```

## 🔧 Configuración

### 1. Variables de Entorno

Crea/actualiza `.env.local` en `apps/frontend`:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=tu-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
```

### 2. Cliente de Sanity

Crea `apps/frontend/lib/sanity.ts`:

```typescript
import {createClient} from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION!,
  useCdn: true, // `false` si quieres datos siempre actualizados
})

// Helper para generar URLs de imágenes
const builder = imageUrlBuilder(client)

export function urlForImage(source: any) {
  return builder.image(source)
}
```

## 🎨 Ejemplo: Página de ONG Dinámica

### apps/frontend/app/ongs/[slug]/page.tsx

```typescript
import {client, urlForImage} from '@/lib/sanity'
import {notFound} from 'next/navigation'
import Image from 'next/image'

// Query GROQ para obtener una ONG por slug
const ongQuery = `
  *[_type == "ong" && slug.current == $slug && activo == true][0]{
    _id,
    nombre,
    "slug": slug.current,
    descripcion,
    logo,
    mision,
    vision,
    "template": template->{
      nombre,
      layout
    },
    personalizacion{
      colorPrimario,
      colorSecundario,
      colorTexto,
      fuentePrincipal,
      imagenHero,
      galeria[]{
        imagen,
        titulo,
        descripcion
      }
    },
    contacto{
      email,
      telefono,
      direccion,
      redesSociales
    },
    seo{
      titulo,
      descripcion,
      palabrasClave,
      imagenOG
    }
  }
`

async function getONG(slug: string) {
  return await client.fetch(ongQuery, {slug})
}

export default async function ONGPage({
  params,
}: {
  params: {slug: string}
}) {
  const ong = await getONG(params.slug)

  if (!ong) {
    notFound()
  }

  // Helper para obtener el color del objeto color de Sanity
  const getColor = (colorObj: any) => {
    return colorObj?.hex || colorObj || '#000000'
  }

  return (
    <div
      style={{
        '--color-primary': getColor(ong.personalizacion?.colorPrimario),
        '--color-secondary': getColor(ong.personalizacion?.colorSecundario),
        '--color-text': getColor(ong.personalizacion?.colorTexto),
      } as any}
      className="font-[family-name:var(--font-geist-sans)]"
    >
      {/* Hero Section */}
      {ong.personalizacion?.imagenHero && (
        <section className="relative h-[500px] w-full">
          <Image
            src={urlForImage(ong.personalizacion.imagenHero).url()}
            alt={ong.nombre}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
            <div className="text-white">
              {ong.logo && (
                <Image
                  src={urlForImage(ong.logo).width(128).url()}
                  alt={ong.nombre}
                  width={128}
                  height={128}
                  className="mb-4"
                />
              )}
              <h1 className="text-5xl font-bold mb-4">{ong.nombre}</h1>
              {ong.descripcion && (
                <p className="text-xl">{ong.descripcion}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Contenido */}
      <section className="py-16 container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Misión */}
          {ong.mision && (
            <div>
              <h2
                className="text-3xl font-bold mb-4"
                style={{color: 'var(--color-primary)'}}
              >
                Nuestra Misión
              </h2>
              {/* Renderiza los bloques de contenido rico */}
              <div className="prose max-w-none">
                {/* Aquí usarías @portabletext/react para renderizar mision */}
              </div>
            </div>
          )}

          {/* Visión */}
          {ong.vision && (
            <div>
              <h2
                className="text-3xl font-bold mb-4"
                style={{color: 'var(--color-primary)'}}
              >
                Nuestra Visión
              </h2>
              {/* Renderiza los bloques de contenido rico */}
              <div className="prose max-w-none">
                {/* Aquí usarías @portabletext/react para renderizar vision */}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Galería */}
      {ong.personalizacion?.galeria && ong.personalizacion.galeria.length > 0 && (
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Galería</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {ong.personalizacion.galeria.map((item: any, index: number) => (
                <div key={index} className="bg-white rounded-lg overflow-hidden shadow-lg">
                  {item.imagen && (
                    <Image
                      src={urlForImage(item.imagen).width(400).height(300).url()}
                      alt={item.titulo || `Imagen ${index + 1}`}
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover"
                    />
                  )}
                  {(item.titulo || item.descripcion) && (
                    <div className="p-4">
                      {item.titulo && (
                        <h3 className="font-bold mb-2">{item.titulo}</h3>
                      )}
                      {item.descripcion && (
                        <p className="text-gray-600 text-sm">{item.descripcion}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contacto */}
      {ong.contacto && (
        <section
          className="py-16"
          style={{backgroundColor: 'var(--color-secondary)'}}
        >
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center text-white">
              Contáctanos
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-white">
              {ong.contacto.email && (
                <div className="text-center">
                  <h3 className="font-bold mb-2">Email</h3>
                  <a href={`mailto:${ong.contacto.email}`}>
                    {ong.contacto.email}
                  </a>
                </div>
              )}
              {ong.contacto.telefono && (
                <div className="text-center">
                  <h3 className="font-bold mb-2">Teléfono</h3>
                  <a href={`tel:${ong.contacto.telefono}`}>
                    {ong.contacto.telefono}
                  </a>
                </div>
              )}
              {ong.contacto.direccion && (
                <div className="text-center">
                  <h3 className="font-bold mb-2">Dirección</h3>
                  <p>{ong.contacto.direccion}</p>
                </div>
              )}
            </div>

            {/* Redes Sociales */}
            {ong.contacto.redesSociales && (
              <div className="flex justify-center gap-4 mt-8">
                {ong.contacto.redesSociales.facebook && (
                  <a
                    href={ong.contacto.redesSociales.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:opacity-80"
                  >
                    Facebook
                  </a>
                )}
                {ong.contacto.redesSociales.instagram && (
                  <a
                    href={ong.contacto.redesSociales.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:opacity-80"
                  >
                    Instagram
                  </a>
                )}
                {/* ... otras redes sociales */}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

// Metadata dinámica para SEO
export async function generateMetadata({
  params,
}: {
  params: {slug: string}
}) {
  const ong = await getONG(params.slug)

  if (!ong) {
    return {
      title: 'ONG no encontrada',
    }
  }

  return {
    title: ong.seo?.titulo || ong.nombre,
    description: ong.seo?.descripcion || ong.descripcion,
    keywords: ong.seo?.palabrasClave,
    openGraph: {
      title: ong.seo?.titulo || ong.nombre,
      description: ong.seo?.descripcion || ong.descripcion,
      images: ong.seo?.imagenOG
        ? [urlForImage(ong.seo.imagenOG).width(1200).height(630).url()]
        : [],
    },
  }
}
```

## 📋 Lista de ONGs

### apps/frontend/app/ongs/page.tsx

```typescript
import {client, urlForImage} from '@/lib/sanity'
import Image from 'next/image'
import Link from 'next/link'

const ongsQuery = `
  *[_type == "ong" && activo == true] | order(nombre asc){
    _id,
    nombre,
    "slug": slug.current,
    descripcion,
    logo
  }
`

async function getONGs() {
  return await client.fetch(ongsQuery)
}

export default async function ONGsPage() {
  const ongs = await getONGs()

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-12 text-center">
        Organizaciones Sociales
      </h1>
      <div className="grid md:grid-cols-3 gap-8">
        {ongs.map((ong: any) => (
          <Link
            key={ong._id}
            href={`/ongs/${ong.slug}`}
            className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition"
          >
            {ong.logo && (
              <Image
                src={urlForImage(ong.logo).width(96).url()}
                alt={ong.nombre}
                width={96}
                height={96}
                className="mx-auto mb-4"
              />
            )}
            <h2 className="text-xl font-bold mb-2 text-center">{ong.nombre}</h2>
            {ong.descripcion && (
              <p className="text-gray-600 text-center">{ong.descripcion}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

// Revalidar cada 60 segundos
export const revalidate = 60
```

## 📝 Renderizar Contenido Rico (Portable Text)

Instala el paquete:

```bash
npm install @portabletext/react
```

Crea un componente para renderizar:

```typescript
import {PortableText} from '@portabletext/react'

// Componentes personalizados
const components = {
  block: {
    h1: ({children}: any) => <h1 className="text-4xl font-bold mb-4">{children}</h1>,
    h2: ({children}: any) => <h2 className="text-3xl font-bold mb-3">{children}</h2>,
    normal: ({children}: any) => <p className="mb-4">{children}</p>,
  },
  marks: {
    link: ({children, value}: any) => (
      <a href={value.href} className="text-blue-600 hover:underline">
        {children}
      </a>
    ),
  },
}

// Uso
<PortableText value={ong.mision} components={components} />
```

## 🔄 Revalidación y ISR

Sanity funciona perfectamente con ISR (Incremental Static Regeneration) de Next.js:

```typescript
// Revalidar cada 60 segundos
export const revalidate = 60

// O revalidar bajo demanda con webhooks de Sanity
```

## 📚 Recursos Adicionales

- [Sanity + Next.js Guide](https://www.sanity.io/guides/nextjs-app-router)
- [GROQ Cheat Sheet](https://www.sanity.io/docs/query-cheat-sheet)
- [Portable Text](https://www.sanity.io/docs/presenting-block-text)
