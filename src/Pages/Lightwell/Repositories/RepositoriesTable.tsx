import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import {
  DataViewTable,
  DataViewTh,
  DataViewTrObject,
} from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataView, DataViewState } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewTextFilter } from '@patternfly/react-data-view/dist/dynamic/DataViewTextFilter';
import { DataViewFilters } from '@patternfly/react-data-view/dist/dynamic/DataViewFilters';
import { useDataViewSort } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { Button, Pagination } from '@patternfly/react-core';
import { CopyIcon } from '@patternfly/react-icons';
import { SkeletonTableBody } from '@patternfly/react-component-groups';
import { ThProps } from '@patternfly/react-table';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import flex from '@patternfly/react-styles/css/utilities/Flex/flex';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

import EmptyTableDataView from 'components/EmptyTableDataView/EmptyTableDataView';
import Header from 'components/Header/Header';
import { FilterData } from 'services/Content/ContentApi';
import { useContentListQuery } from 'services/Content/ContentQueries';

import {
  LIGHTWELL_FEATURE_NAME,
  isLightwellMockDataEnabled,
  lightwellPerPageKey,
} from '../constants';
import { getMockLightwellRepositoryList } from '../mockRepositories';

const columns = [
  { name: 'Name', sortAttribute: 'name' },
  { name: 'Description', sortAttribute: null },
  { name: 'Ecosystem', sortAttribute: 'ecosystem' },
  { name: 'Security level', sortAttribute: 'security_level' },
  { name: 'Packages', sortAttribute: null },
  { name: 'Repo URL', sortAttribute: null },
] as const;

const displayValue = (value?: string) => (value?.trim() ? value : '—');

const RepositoriesTable = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const storedPerPage = Number(localStorage.getItem(lightwellPerPageKey)) || 20;
  const [perPage, setPerPage] = useState(storedPerPage);
  const [filters, setFilters] = useState<FilterData>({
    search: '',
    feature_name: LIGHTWELL_FEATURE_NAME,
  });
  const [activeState, setActiveState] = useState<DataViewState | undefined>(DataViewState.loading);

  const { sortBy, direction, onSort } = useDataViewSort({
    defaultDirection: 'asc',
  });

  const sortString = useMemo(() => {
    if (!sortBy || !direction) return '';
    const column = columns.find((col) => col.name === sortBy);
    if (!column?.sortAttribute) return '';
    return `${column.sortAttribute}:${direction}`;
  }, [sortBy, direction]);

  const getSortParams = (columnIndex: number): ThProps['sort'] => {
    const activeSortIndex = sortBy ? columns.findIndex((col) => col.name === sortBy) : -1;

    return {
      sortBy: {
        index: activeSortIndex,
        direction,
      },
      onSort: (_event, index, sortDirection) => onSort(_event, columns[index].name, sortDirection),
      columnIndex,
    };
  };

  const dataViewColumns: DataViewTh[] = columns.map((column, index) => ({
    cell: column.name,
    props: column.sortAttribute === null ? {} : { sort: getSortParams(index) },
  }));

  const isFiltered = (filters.search ?? '').trim().length > 0;
  const useMock = isLightwellMockDataEnabled();

  const mockQuery = useQuery({
    queryKey: ['lightwell-repositories-mock', page, perPage, filters],
    queryFn: () => getMockLightwellRepositoryList(page, perPage, filters),
    placeholderData: keepPreviousData,
    staleTime: 20000,
    enabled: useMock,
  });

  const apiQuery = useContentListQuery(page, perPage, filters, sortString, [], !useMock);

  const { isLoading, isError, error, data = { data: [], meta: { count: 0, limit: 20, offset: 0 } } } =
    useMock ? mockQuery : apiQuery;

  const {
    data: repositories = [],
    meta: { count = 0 },
  } = data;

  useEffect(() => {
    if (isLoading) {
      setActiveState(DataViewState.loading);
    } else {
      setActiveState(count === 0 ? DataViewState.empty : undefined);
    }
  }, [count, isLoading]);

  if (isError) throw error;

  const onSetPage = (_, newPage: number) => setPage(newPage);

  const onPerPageSelect = (_, newPerPage: number, newPage: number) => {
    localStorage.setItem(lightwellPerPageKey, newPerPage.toString());
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const paginationProps = {
    isDisabled: isLoading,
    itemCount: count,
    perPage,
    page,
    onSetPage,
    onPerPageSelect,
  };

  const clearFilters = () => {
    setFilters({ search: '', feature_name: LIGHTWELL_FEATURE_NAME });
    setPage(1);
  };

  const rows: DataViewTrObject[] = useMemo(
    () =>
      repositories.map((repo) => {
        const { uuid, name, description, ecosystem, security_level, package_count, url } = repo;

        return {
          id: uuid,
          row: [
            {
              cell: (
                <Button
                  variant='link'
                  isInline
                  ouiaId={`lightwell-repo-${uuid}`}
                  onClick={() => navigate(uuid)}
                >
                  {name}
                </Button>
              ),
            },
            { cell: displayValue(description) },
            { cell: displayValue(ecosystem) },
            { cell: displayValue(security_level) },
            {
              cell:package_count.toString(),
            },
            {
              cell: (
                <Button
                  variant='link'
                  isInline
                  icon={<CopyIcon />}
                  iconPosition='end'
                  ouiaId={`copy-repo-url-${uuid}`}
                  onClick={() => navigator.clipboard.writeText(url)}
                >
                  Copy URL
                </Button>
              ),
            },
          ],
        };
      }),
    [repositories, navigate],
  );

  return (
    <>
      <Header
        title='Lightwell - Repositories'
        ouiaId='lightwell-header'
        paragraph='Open source libraries rebuilt securely with backported fixes for known vulnerabilities.'
      />
      <DataView
        ouiaId='lightwell-repositories-page'
        activeState={activeState}
        className={`${spacing.pxLg} ${spacing.ptMd} ${flex.flexDirectionColumn}`}
      >
        <DataViewToolbar
          ouiaId='lightwell-repositories-toolbar'
          clearAllFilters={clearFilters}
          filters={
            <DataViewFilters
              values={filters}
              onChange={(_key, newValues) => {
                setFilters({
                  search: newValues.search ?? '',
                  feature_name: LIGHTWELL_FEATURE_NAME,
                });
                setPage(1);
              }}
            >
              <DataViewTextFilter
                filterId='search'
                ouiaId='lightwell-repositories-filter-name'
                aria-label='Filter repositories by name'
                title='Name'
                placeholder='Filter by name'
                isDisabled={isLoading}
              />
            </DataViewFilters>
          }
          pagination={
            <Pagination
              id='lightwell-top-pagination'
              widgetId='lightwellTopPaginationWidgetId'
              {...paginationProps}
            />
          }
        />
        <DataViewTable
          aria-label='Lightwell repositories table'
          ouiaId='lightwell-repositories-table'
          variant='compact'
          columns={dataViewColumns}
          rows={rows}
          bodyStates={{
            empty: (
              <EmptyTableDataView
                ouiaId='lightwell-repositories-table'
                variant={isFiltered ? 'filtered' : 'zero'}
                itemName='repositories'
                zeroBody='No Lightwell repositories are available yet.'
                colSpan={columns.length}
                onClearFilters={clearFilters}
              />
            ),
            loading: <SkeletonTableBody rowsCount={perPage} columnsCount={columns.length} />,
          }}
        />
        <DataViewToolbar
          pagination={
            <Pagination
              id='lightwell-bottom-pagination'
              widgetId='lightwellBottomPaginationWidgetId'
              {...paginationProps}
              variant='bottom'
            />
          }
        />
      </DataView>
    </>
  );
};

export default RepositoriesTable;
