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
