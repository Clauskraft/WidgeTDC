interface PersonalEntity {
  user_id: string;
  org_id: string;
  entity_type: string;
  consent_given: boolean;
  name?: string;
  preferences?: Record<string, any>;
  creds?: {
    access_token: string;
    refresh_token?: string;
    expires_at?: string;
    encrypt_key?: string;
    [key: string]: any;
  };
  source_type?: string;
}

interface TempState {
  state: string;
  orgId: string;
}

const entities = new Map<string, PersonalEntity[]>();
const tempStates = new Map<string, TempState>();

function upsertToStore(userId: string, record: PersonalEntity): void {
  const current = entities.get(userId) ?? [];
  const existingIndex = current.findIndex(entity => entity.entity_type === record.entity_type);
  if (existingIndex >= 0) {
    current[existingIndex] = { ...current[existingIndex], ...record };
  } else {
    current.push(record);
  }
  entities.set(userId, current);
}

export const PersonalEntityRepository = {
  async findByUserAndType(userId: string, type: string): Promise<PersonalEntity | null> {
    const list = entities.get(userId) ?? [];
    return list.find(entity => entity.entity_type === type) ?? null;
  },

  async findManyByUserAndTypes(userId: string, types: string[]): Promise<PersonalEntity[]> {
    const list = entities.get(userId) ?? [];
    return list.filter(entity => types.includes(entity.entity_type));
  },

  async upsert(userId: string, record: Omit<PersonalEntity, 'user_id'>): Promise<void> {
    upsertToStore(userId, { ...record, user_id: userId });
  },

  async updateCreds(userId: string, creds: Partial<PersonalEntity['creds']>): Promise<void> {
    const entity = await PersonalEntityRepository.findByUserAndType(userId, 'aula-credentials');
    if (!entity) {
      return;
    }
    entity.creds = { ...(entity.creds ?? {}), ...creds };
    upsertToStore(userId, entity);
  },

  async getUsersWithAulaConsent(): Promise<Array<{ user_id: string; org_id: string }>> {
    const result: Array<{ user_id: string; org_id: string }> = [];
    entities.forEach(userEntities => {
      userEntities
        .filter(entity => entity.entity_type === 'aula-credentials' && entity.consent_given)
        .forEach(entity => result.push({ user_id: entity.user_id, org_id: entity.org_id }));
    });
    return result;
  },

  async storeTempState(userId: string, value: TempState): Promise<void> {
    tempStates.set(userId, value);
  },

  async getTempState(userId: string): Promise<TempState> {
    return tempStates.get(userId) ?? { state: '', orgId: '' };
  },
};

export type { PersonalEntity };
