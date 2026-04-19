let _vaultRepo: string | null = null;

export function setVaultRepo(repo: string) {
  _vaultRepo = repo;
}

function getVaultBase(): string | null {
  if (!_vaultRepo) return null;
  return `https://github.com/${_vaultRepo}/blob/main`;
}

export interface DocDisplayInfo {
  displayPath: string;
  projectVaultUrl: string | null;
  projectDisplay: string | null;
  vaultUrl: string | null;
  fileUrl: string | null;
  isUniversal: boolean;
}

export function getDocDisplayInfo(sourceFile: string, project?: string | null): DocDisplayInfo {
  const displayPath = sourceFile.startsWith('github.com/')
    ? sourceFile.replace(/^github\.com\/[^/]+\/[^/]+\//, '')
    : sourceFile;

  const isUniversal = !project;
  const vaultBase = getVaultBase();

  let projectVaultUrl: string | null = null;
  let projectDisplay: string | null = null;
  let fileUrl: string | null = null;
  let vaultUrl: string | null = null;

  if (project) {
    const ghProject = project.includes('github.com') ? project : `github.com/${project}`;
    if (vaultBase) projectVaultUrl = `${vaultBase}/${ghProject}`;
    projectDisplay = project.replace('github.com/', '');
    fileUrl = `https://${ghProject}/blob/main/${displayPath}`;
  }

  if (vaultBase) vaultUrl = `${vaultBase}/${sourceFile}`;

  return { displayPath, projectVaultUrl, projectDisplay, vaultUrl, fileUrl, isUniversal };
}
