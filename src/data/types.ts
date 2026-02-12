export interface Tool {
  id: string;
  name: string;
  typ: string;
  ki: boolean;
  kiDetail?: string;
  lernende: boolean;
  lernendeDetail?: string;
  lp: boolean;
  lizenz: string;
  lizenzDetail?: string;
  funcs: string;
  beherrschen: boolean;
  lernen: boolean;
  lpOrg: boolean;
  lpVorb: boolean;
  behDesc: string;
  lernDesc: string;
  lpOrgDesc: string;
  lpVorbDesc: string;
}

export interface ProcessStep {
  title: string;
  description: string;
  actor: string;
}

export interface ProcessFlow {
  id: string;
  title: string;
  icon: string;
  color: string;
  steps: ProcessStep[];
}
