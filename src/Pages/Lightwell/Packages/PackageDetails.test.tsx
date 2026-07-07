import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PackageDetails from './PackageDetails';
import {
  useLightwellRepositoryPackagesQuery,
  useMavenPackageVersionsListQuery,
  usePythonPackageVersionsQuery,
} from 'services/Content/ContentQueries';
import {
  defaultLightwellContentItem,
  defaultLightwellRepositoryPackageItem,
  defaultLightwellRepositoryPackageResponse,
  defaultPythonRemediatedContentItem,
  defaultPythonPackageVersions,
  defaultPythonRemediatedRepositoryPackageItem,
  defaultPythonValidatedContentItem,
  defaultPythonValidatedPackageItem,
  defaultPythonValidatedPackageVersions,
  gradleRemediatedDependencySnippet,
  gradleValidatedDependencySnippet,
  javaRemediatedCopyCommand,
  javaValidatedCopyCommand,
  mavenRemediatedDependencySnippet,
  mavenValidatedDependencySnippet,
  pipConfRemediatedInstallSnippet,
  pipConfValidatedInstallSnippet,
  pipRemediatedInstallSnippet,
  pipValidatedInstallSnippet,
  pythonRemediatedPipCommand,
  pythonValidatedPipCommand,
  ReactQueryTestWrapper,
  requirementsRemediatedInstallSnippet,
  requirementsValidatedInstallSnippet,
  otherPythonRemediatedPipCommand,
  otherJavaRemediatedCopyCommand,
} from 'testingHelpers';
import { RepositoryPackageItem } from 'services/Content/ContentApi';
import { getRepositoryPathSlug } from '../helpers';
import useLightwellRepository from '../useLightwellRepository';

jest.mock('services/Content/ContentQueries', () => ({
  useLightwellRepositoryPackagesQuery: jest.fn(),
  useMavenPackageVersionsListQuery: jest.fn(),
  usePythonPackageVersionsQuery: jest.fn(),
}));

jest.mock('../useLightwellRepository');

const defaultRepoSlug = getRepositoryPathSlug(
  defaultLightwellContentItem.content_type,
  defaultLightwellContentItem.security_level,
);

const packageName = defaultLightwellRepositoryPackageItem.name;

const mockUseParams = jest.fn<
  Partial<{ repoName: string; group: string; packageName: string }>,
  []
>();

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useParams: () => mockUseParams(),
}));

jest.mock('../../../Hooks/useLightwellNavigate', () => ({
  useLightwellNavigate: () => ({
    goToRepositories: jest.fn(),
    goToRepositoryPackages: jest.fn(),
  }),
}));

const defaultBuilds = [
  { version: '3.14.0.rhlw-00001', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' },
];

const multiVersionReleasePackage: RepositoryPackageItem = {
  group: 'org.json.test',
  name: 'json-test',
  versions: ['3.14.0', '2.12.0'],
  latest_releases: [
    { version: '3.14.0', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' },
    { version: '2.12.0', release: 'rhlw-00002', created_at: '2026-06-18T00:00:00Z' },
  ],
};

const multiVersionNoReleasePackage: RepositoryPackageItem = {
  group: 'org.json.test',
  name: 'json-test',
  versions: ['2.21.2', '2.20.0', '2.19.1'],
  latest_releases: [
    { version: '2.21.2', release: '', created_at: '2026-07-01T00:00:00Z' },
    { version: '2.20.0', release: '', created_at: '2026-06-15T00:00:00Z' },
    { version: '2.19.1', release: '', created_at: '2026-06-01T00:00:00Z' },
  ],
};

const noReleaseBuilds = [{ version: '2.21.2', release: '', created_at: '2026-07-01T00:00:00Z' }];

type PackageMetadata = {
  summary?: string;
  license?: string;
  author?: string;
  project_url?: string;
};

const mockVersionsListQuery = (
  builds = defaultBuilds,
  metadata: PackageMetadata = {},
  version = '3.14.0',
) => ({
  isLoading: false,
  data: {
    group: defaultLightwellRepositoryPackageItem.group,
    name: defaultLightwellRepositoryPackageItem.name,
    versions: [
      {
        group: defaultLightwellRepositoryPackageItem.group,
        name: defaultLightwellRepositoryPackageItem.name,
        version,
        builds,
        ...metadata,
      },
    ],
  },
});

const mockPackagesQuery = () => ({
  isLoading: false,
  isFetching: false,
  data: {
    ...defaultLightwellRepositoryPackageResponse,
    results: [defaultLightwellRepositoryPackageItem],
    total: 1,
  },
});

const renderPackageDetails = () =>
  render(
    <ReactQueryTestWrapper>
      <PackageDetails />
    </ReactQueryTestWrapper>,
  );

beforeEach(() => {
  mockUseParams.mockReturnValue({
    repoName: defaultRepoSlug,
    group: defaultLightwellRepositoryPackageItem.group,
    packageName,
  });
  (useLightwellRepository as jest.Mock).mockReturnValue({
    repository: defaultLightwellContentItem,
    repoUUID: defaultLightwellContentItem.uuid,
    isLoading: false,
    isError: false,
    error: undefined,
  });
  (useLightwellRepositoryPackagesQuery as jest.Mock).mockImplementation(mockPackagesQuery);
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() => mockVersionsListQuery());
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: undefined,
  }));
});

it('shows empty state when the package has no builds', async () => {
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() =>
    mockVersionsListQuery([]),
  );

  renderPackageDetails();

  expect(await screen.findByText('No details available yet for this package.')).toBeInTheDocument();
});

const setupNoReleasePackage = () => {
  (useLightwellRepositoryPackagesQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: {
      ...defaultLightwellRepositoryPackageResponse,
      results: [multiVersionNoReleasePackage],
      total: 1,
    },
  }));
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() =>
    mockVersionsListQuery(noReleaseBuilds, {}, '2.21.2'),
  );
};

const setupPythonRemediatedPackage = () => {
  mockUseParams.mockReturnValue({
    repoName: getRepositoryPathSlug('python', 'remediated'),
    packageName: defaultPythonRemediatedRepositoryPackageItem.name,
  });
  (useLightwellRepository as jest.Mock).mockReturnValue({
    repository: defaultPythonRemediatedContentItem,
    repoUUID: defaultPythonRemediatedContentItem.uuid,
    isLoading: false,
    isError: false,
    error: undefined,
  });
  (useLightwellRepositoryPackagesQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: {
      ...defaultLightwellRepositoryPackageResponse,
      results: [defaultPythonRemediatedRepositoryPackageItem],
      total: 1,
    },
  }));
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: defaultPythonPackageVersions,
  }));
};

it('does not show Releases tab when package has no release', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  expect(await screen.findByText('Overview')).toBeInTheDocument();
  expect(screen.queryByText('Releases')).not.toBeInTheDocument();
});

it('renders package detail content with builds', async () => {
  renderPackageDetails();

  expect(await screen.findByRole('heading', { name: packageName })).toBeInTheDocument();
  expect(await screen.findByText('Overview')).toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'Releases' })).toBeInTheDocument();
  expect(await screen.findByText('About this package')).toBeInTheDocument();
  expect(await screen.findByText('How to use')).toBeInTheDocument();
});

it('renders sidebar metadata', async () => {
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() =>
    mockVersionsListQuery(defaultBuilds, {
      summary: 'JSON library for Java',
      license: 'MIT',
      author: 'JSON.org',
      project_url: 'https://example.com/json-test',
    }),
  );

  renderPackageDetails();

  expect(await screen.findByText('Last updated')).toBeInTheDocument();
  expect(await screen.findAllByText('2026-07-01')).toHaveLength(2);
  expect(await screen.findByText('Group ID')).toBeInTheDocument();
  expect(await screen.findByText(defaultLightwellRepositoryPackageItem.group)).toBeInTheDocument();
  expect(await screen.findByText('Rebuilt by')).toBeInTheDocument();
  expect(await screen.findByText('Red Hat')).toBeInTheDocument();
  expect(await screen.findByText('JSON library for Java')).toBeInTheDocument();
  expect(await screen.findByText('License')).toBeInTheDocument();
  expect(await screen.findByText('MIT')).toBeInTheDocument();
  expect(await screen.findByText('Original author')).toBeInTheDocument();
  expect(await screen.findByText('JSON.org')).toBeInTheDocument();
  expect(await screen.findByText('Project')).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: 'Source' })).toHaveAttribute(
    'href',
    'https://example.com/json-test',
  );
});

it('shows fallback summary when maven package summary is unavailable', async () => {
  renderPackageDetails();

  expect(await screen.findByText('Package description not yet available.')).toBeInTheDocument();
  expect(screen.queryByText('License')).not.toBeInTheDocument();
  expect(screen.queryByText('Original author')).not.toBeInTheDocument();
});

it('shows Versions tab for non-release packages', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  expect(await screen.findByText('Versions')).toBeInTheDocument();
  expect(screen.queryByText('Releases')).not.toBeInTheDocument();
});

it('shows version selector dropdown for non-release packages', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  const toggle = await screen.findByRole('button', { name: '2.21.2' });
  expect(toggle).toBeInTheDocument();
  expect(toggle.classList.contains('pf-v6-c-menu-toggle')).toBe(true);

  await userEvent.click(toggle);

  const menuItems = await screen.findAllByRole('menuitem');
  expect(menuItems).toHaveLength(3);
});

it('shows non-release description text', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  expect(
    await screen.findByText(/rebuilt from source by Red Hat with no modifications/),
  ).toBeInTheDocument();
});

it('shows upstream versions list in sidebar for non-release packages', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  expect(await screen.findByText('Upstream versions')).toBeInTheDocument();
  expect(await screen.findByText('2.21.2, 2.20.0, 2.19.1')).toBeInTheDocument();
});

const setupMultiVersionReleasePackage = () => {
  (useLightwellRepositoryPackagesQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: {
      ...defaultLightwellRepositoryPackageResponse,
      results: [multiVersionReleasePackage],
      total: 1,
    },
  }));
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() => mockVersionsListQuery());
};

it('shows "Available versions" on Releases tab for multi-version release packages', async () => {
  setupMultiVersionReleasePackage();

  renderPackageDetails();

  const releasesTab = await screen.findByRole('tab', { name: 'Releases' });
  await userEvent.click(releasesTab);

  expect(await screen.findByText('Available versions')).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: '2.12.0' })).toBeInTheDocument();
  expect(await screen.findByText('2.12.0.rhlw-00002')).toBeInTheDocument();
  expect(await screen.findByText('2026-06-18')).toBeInTheDocument();
});

it('shows version dropdown for multi-version release packages', async () => {
  setupMultiVersionReleasePackage();

  renderPackageDetails();

  const toggle = await screen.findByRole('button', { name: '3.14.0' });
  expect(toggle).toBeInTheDocument();

  await userEvent.click(toggle);

  const menuItems = await screen.findAllByRole('menuitem');
  expect(menuItems).toHaveLength(2);
});

it('shows how to use section for python package', async () => {
  setupPythonRemediatedPackage();

  renderPackageDetails();

  expect(
    await screen.findByRole('heading', { name: defaultPythonRemediatedRepositoryPackageItem.name }),
  ).toBeInTheDocument();
  expect(await screen.findByText('How to use')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Install' })).not.toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'pip' })).toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'requirements.txt' })).toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'pip.conf' })).toBeInTheDocument();
  expect(
    await screen.findByRole('button', { name: pythonRemediatedPipCommand }),
  ).toBeInTheDocument();
  expect(document.body).toHaveTextContent(pythonRemediatedPipCommand);
});

const mockClipboard = () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  return writeText;
};

const assertClipboardCopy = async (
  writeText: jest.Mock,
  click: () => Promise<void>,
  expected: string,
) => {
  writeText.mockClear();
  await click();
  expect(writeText).toHaveBeenCalledTimes(1);
  expect(writeText).toHaveBeenCalledWith(expected);
};

it('copies pip command to clipboard for remediated python package', async () => {
  const writeText = mockClipboard();

  setupPythonRemediatedPackage();
  renderPackageDetails();

  // PackageDetails header
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(
        await screen.findByRole('button', { name: pythonRemediatedPipCommand }),
      );
    },
    pythonRemediatedPipCommand,
  );

  // pip tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    pipRemediatedInstallSnippet,
  );

  // requirements.txt tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'requirements.txt' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    requirementsRemediatedInstallSnippet,
  );

  // pip.conf tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'pip.conf' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    pipConfRemediatedInstallSnippet,
  );

  // "Releases for version x.x.x" section of Releases tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'Releases' }));
      const buttons = await screen.findAllByRole('button', { name: '2.32.0.rhlw-0002' });
      await userEvent.click(buttons[0]);
    },
    pythonRemediatedPipCommand,
  );

  // "Available versions" section of Releases tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByText('2.31.0.rhlw-0001'));
    },
    otherPythonRemediatedPipCommand,
  );
});

it('copies maven coordinate to clipboard for remediated java package', async () => {
  const writeText = mockClipboard();

  setupMultiVersionReleasePackage();
  renderPackageDetails();

  // PackageDetails header
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: javaRemediatedCopyCommand }));
    },
    javaRemediatedCopyCommand,
  );

  // Maven tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    mavenRemediatedDependencySnippet,
  );

  // Gradle tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'Gradle' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    gradleRemediatedDependencySnippet,
  );

  // "Releases for version x.x.x" section of Releases tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'Releases' }));
      const buttons = await screen.findAllByRole('button', { name: '3.14.0.rhlw-00001' });
      await userEvent.click(buttons[0]);
    },
    javaRemediatedCopyCommand,
  );

  // "Available versions" section of Releases tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByText('2.12.0.rhlw-00002'));
    },
    otherJavaRemediatedCopyCommand,
  );
});

const setupPythonValidatedPackage = () => {
  mockUseParams.mockReturnValue({
    repoName: getRepositoryPathSlug('python', 'validated'),
    packageName: defaultPythonValidatedPackageItem.name,
  });
  (useLightwellRepository as jest.Mock).mockReturnValue({
    repository: defaultPythonValidatedContentItem,
    repoUUID: defaultPythonValidatedContentItem.uuid,
    isLoading: false,
    isError: false,
    error: undefined,
  });
  (useLightwellRepositoryPackagesQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: {
      ...defaultLightwellRepositoryPackageResponse,
      results: [defaultPythonValidatedPackageItem],
      total: 1,
    },
  }));
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: defaultPythonValidatedPackageVersions,
  }));
};

it('copies pip command to clipboard for validated python package', async () => {
  const writeText = mockClipboard();

  setupPythonValidatedPackage();
  renderPackageDetails();

  // PackageDetails header
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: pythonValidatedPipCommand }));
    },
    pythonValidatedPipCommand,
  );

  // pip tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    pipValidatedInstallSnippet,
  );

  // requirements.txt tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'requirements.txt' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    requirementsValidatedInstallSnippet,
  );

  // pip.conf tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'pip.conf' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    pipConfValidatedInstallSnippet,
  );
});

it('copies maven coordinate to clipboard for validated java package', async () => {
  const writeText = mockClipboard();

  setupNoReleasePackage();
  renderPackageDetails();

  // PackageDetails header
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: javaValidatedCopyCommand }));
    },
    javaValidatedCopyCommand,
  );

  // Maven tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    mavenValidatedDependencySnippet,
  );

  // Gradle tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'Gradle' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    gradleValidatedDependencySnippet,
  );
});
