import { FiservWebhookService } from './fiserv-webhook.service';

describe('FiservWebhookService - ensureBondaAffiliateForUserAndOrganisation', () => {
  const organizacionId = 'org-1';
  const userId = 'user-1';
  const microsite = { id: 'microsite-1', slug: 'ong-x' };
  const user = {
    id: userId,
    email: 'user@example.com',
    nombre: 'Usuario Real',
    telefono: undefined,
    provincia: undefined,
    localidad: undefined,
    dni: '30111222',
  };

  const duplicatedCodeResponse = {
    success: false,
    error: {
      detail: { code: ['El código ya lo está utilizando otro afiliado'] },
    },
  };

  function buildService(
    overrides: {
      bonda?: Partial<Record<string, jest.Mock>>;
      supabase?: Partial<Record<string, jest.Mock>>;
    } = {},
  ) {
    const bonda = {
      crearAfiliado: jest.fn().mockResolvedValue(duplicatedCodeResponse),
      actualizarAfiliado: jest.fn().mockResolvedValue({ success: true }),
      obtenerAfiliado: jest.fn(),
      ...overrides.bonda,
    };

    const supabase = {
      getBondaMicrositeByOrganizacionId: jest.fn().mockResolvedValue(microsite),
      getAffiliateForUserAndMicrosite: jest.fn().mockResolvedValue(null),
      findUserById: jest.fn().mockResolvedValue(user),
      upsertAffiliateForUser: jest.fn().mockResolvedValue(undefined),
      ...overrides.supabase,
    };

    const service = new FiservWebhookService(
      {} as any, // fiservConnect (no usado en este método)
      supabase as any,
      bonda as any,
      {} as any, // mailService
      {} as any, // fiservQrService
    );

    return { service, bonda, supabase };
  }

  it('vincula y actualiza cuando el afiliado existente en Bonda pertenece al mismo usuario', async () => {
    const { service, bonda, supabase } = buildService({
      bonda: {
        obtenerAfiliado: jest.fn().mockResolvedValue({
          success: true,
          data: { member: { email: user.email } },
        }),
      },
    });

    await service.ensureBondaAffiliateForUserAndOrganisation(
      userId,
      organizacionId,
    );

    expect(bonda.obtenerAfiliado).toHaveBeenCalledWith(String(30111222), {
      organizacionId,
    });
    expect(bonda.actualizarAfiliado).toHaveBeenCalled();
    expect(supabase.upsertAffiliateForUser).toHaveBeenCalledWith(
      userId,
      microsite.id,
      String(30111222),
    );
  });

  it('NO vincula ni sobrescribe cuando el código coincide pero pertenece a otro email', async () => {
    const { service, bonda, supabase } = buildService({
      bonda: {
        obtenerAfiliado: jest.fn().mockResolvedValue({
          success: true,
          data: { member: { email: 'otra-persona@example.com' } },
        }),
      },
    });

    await service.ensureBondaAffiliateForUserAndOrganisation(
      userId,
      organizacionId,
    );

    expect(bonda.actualizarAfiliado).not.toHaveBeenCalled();
    expect(supabase.upsertAffiliateForUser).not.toHaveBeenCalled();
  });

  it('NO vincula cuando no se puede verificar el afiliado existente en Bonda (lookup falla)', async () => {
    const { service, bonda, supabase } = buildService({
      bonda: {
        obtenerAfiliado: jest.fn().mockRejectedValue(new Error('timeout')),
      },
    });

    await service.ensureBondaAffiliateForUserAndOrganisation(
      userId,
      organizacionId,
    );

    expect(bonda.actualizarAfiliado).not.toHaveBeenCalled();
    expect(supabase.upsertAffiliateForUser).not.toHaveBeenCalled();
  });

  it('NO vincula si la actualización en Bonda falla aunque el email coincida', async () => {
    const { service, bonda, supabase } = buildService({
      bonda: {
        obtenerAfiliado: jest.fn().mockResolvedValue({
          success: true,
          data: { member: { email: user.email } },
        }),
        actualizarAfiliado: jest
          .fn()
          .mockRejectedValue(new Error('Bonda caído')),
      },
    });

    await service.ensureBondaAffiliateForUserAndOrganisation(
      userId,
      organizacionId,
    );

    expect(supabase.upsertAffiliateForUser).not.toHaveBeenCalled();
  });
});
