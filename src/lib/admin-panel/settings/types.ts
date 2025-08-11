export interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export type CivilizationCreateData = {
  name: string;
  description?: string;
  content?: string;
  thumbnailUrl?: string;
};

export type CivilizationUpdateData = Partial<CivilizationCreateData>;

export type CivilizationFormSchema = CivilizationCreateData;

// BaseMap types
export type BaseMapCreateData = {
  name: string;
  description?: string;
  thumbnailUrl?: string;
};

export type BaseMapUpdateData = Partial<BaseMapCreateData>;

export type BaseMapFormSchema = BaseMapCreateData;

// Map types
export type MapCreateData = {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  baseMapId: string;
};

export type MapUpdateData = Partial<MapCreateData>;

export type MapFormSchema = MapCreateData;
