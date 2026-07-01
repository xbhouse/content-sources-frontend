import { render, screen } from '@testing-library/react';

import RepositoriesTable from './RepositoriesTable';
import { useContentListQuery } from 'services/Content/ContentQueries';
import { defaultLightwellContentItem, ReactQueryTestWrapper } from 'testingHelpers';

jest.mock('services/Content/ContentQueries', () => ({
  useContentListQuery: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

const renderRepositoriesTable = () =>
  render(
    <ReactQueryTestWrapper>
      <RepositoriesTable />
    </ReactQueryTestWrapper>,
  );

it('shows empty state when there are no repositories', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({ isLoading: false }));

  renderRepositoriesTable();

  expect(await screen.findByText('No Lightwell repositories are available yet.')).toBeInTheDocument();
});

it('renders with a single row', async () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [defaultLightwellContentItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  renderRepositoriesTable();

  expect(await screen.findByText(defaultLightwellContentItem.name)).toBeInTheDocument();
  defaultLightwellContentItem.ecosystem && 
    expect(await screen.findByText(defaultLightwellContentItem.ecosystem)).toBeInTheDocument();
  defaultLightwellContentItem.security_level && 
    expect(await screen.findByText(defaultLightwellContentItem.security_level)).toBeInTheDocument();
  expect(await screen.findByText(defaultLightwellContentItem.package_count.toString())).toBeInTheDocument();
});
