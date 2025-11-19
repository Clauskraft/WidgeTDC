interface PersonalEntity {
  user_id: string;
  org_id: string;
  entity_type: string;
  consent_given: boolean;
  name?: string;
  source_type?: string;
  preferences?: Record<string, unknown>;
  creds?: {
    access_token?: string;
    refresh_token?: string;
    encrypt_key?: string;
    expires_at?: string;
  };
}

interface TempState {
  state: string;
  orgId: string;
  expiresAt: number;
}

const personalEntities: PersonalEntity[] = [
  {
    user_id: 'demo-user',
    org_id: 'demo-org',
    entity_type: 'self',
    consent_given: true,
    preferences: { locale: 'da-DK', channels: ['push', 'email'] },
  },
  {
    user_id: 'demo-user',
    org_id: 'demo-org',
    entity_type: 'family',
    consent_given: true,
    preferences: { locale: 'da-DK' },
  },
  {
    user_id: 'demo-user',
    org_id: 'demo-org',
    entity_type: 'aula-credentials',
    consent_given: true,
    name: 'Aula OAuth Token',
    source_type: 'oauth2',
    creds: {
      access_token: 'demo-access-token',
      refresh_token: 'demo-refresh-token',
      encrypt_key: 'demo-key',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
  },
];

const tempStates = new Map<string, TempState>();

function normalizeTypes(types: string | string[]): string[] {
  return Array.isArray(types) ? types : [types];
}

function touchEntity(userId: string, entityType: string): PersonalEntity {
  let entity = personalEntities.find(
    candidate => candidate.user_id === userId && candidate.entity_type === entityType
  );

  if (!entity) {
    entity = {
      user_id: userId,
      org_id: 'unknown',
      entity_type: entityType,
      consent_given: true,
    };
    personalEntities.push(entity);
  }

  return entity;
}

export const PersonalEntityRepository = {
  async storeTempState(userId: string, payload: { state: string; orgId: string }): Promise<void> {
    tempStates.set(userId, {
      ...payload,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
  },

  async getTempState(userId: string): Promise<TempState> {
    const record = tempStates.get(userId);
    if (!record || record.expiresAt < Date.now()) {
      throw new Error('Temporary Aula OAuth state missing or expired');
    }
    return record;
  },

  async upsert(userId: string, entity: Omit<PersonalEntity, 'user_id'>): Promise<void> {
    const existing = touchEntity(userId, entity.entity_type);
    Object.assign(existing, { ...entity, user_id: userId });
  },

  async updateCreds(userId: string, creds: Partial<PersonalEntity['creds']>): Promise<void> {
    const entity = touchEntity(userId, 'aula-credentials');
    entity.creds = {
      ...entity.creds,
      ...creds,
    };
  },

  async findByUserAndType(
    userId: string,
    types: string | string[]
  ): Promise<PersonalEntity | PersonalEntity[] | null> {
    const normalized = normalizeTypes(types);
    const matches = personalEntities.filter(
      entity => entity.user_id === userId && normalized.includes(entity.entity_type)
    );

    return Array.isArray(types) ? matches : matches[0] ?? null;
  },

  async getUsersWithAulaConsent(): Promise<Array<{ user_id: string; org_id: string }>> {
    return personalEntities
      .filter(entity => entity.entity_type === 'aula-credentials' && entity.consent_given)
      .map(entity => ({ user_id: entity.user_id, org_id: entity.org_id }));
  },
};

export type { PersonalEntity };
