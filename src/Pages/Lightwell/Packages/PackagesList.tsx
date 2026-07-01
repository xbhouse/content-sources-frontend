import { Breadcrumb, BreadcrumbItem, Grid, Stack, StackItem, Title } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { useQuery } from '@tanstack/react-query';
import { createUseStyles } from 'react-jss';
import { useNavigate } from 'react-router-dom';

import EmptyTableState from 'components/EmptyTableState/EmptyTableState';
import Loader from 'components/Loader';
import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';
import { useFetchContent } from 'services/Content/ContentQueries';

import { isLightwellMockDataEnabled } from '../constants';
import { getMockLightwellRepository } from '../mockRepositories';

const useStyles = createUseStyles({
  topContainer: {
    padding: '16px 24px',
  },
  titleWrapper: {
    padding: '24px 0 0',
  },
});

const PackagesList = () => {
  const classes = useStyles();
  const repoUUID = useSafeUUIDParam('repoUUID');
  const navigate = useNavigate();
  const useMock = isLightwellMockDataEnabled();

  const mockQuery = useQuery({
    queryKey: ['lightwell-repository-mock', repoUUID],
    queryFn: () => {
      const repository = getMockLightwellRepository(repoUUID);
      if (!repository) {
        throw new Error('Lightwell repository not found');
      }
      return repository;
    },
    staleTime: 20000,
    enabled: useMock && !!repoUUID,
  });

  const apiQuery = useFetchContent(repoUUID, !!repoUUID && !useMock);

  const { data: repository, isLoading, isError, error } = useMock ? mockQuery : apiQuery;

  if (isError) throw error;

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      <Grid className={classes.topContainer}>
        <Stack>
          <StackItem>
            <Breadcrumb ouiaId='lightwell-packages-breadcrumb'>
              <BreadcrumbItem component='button' onClick={() => navigate('..')}>
                Lightwell - Repositories
              </BreadcrumbItem>
              <BreadcrumbItem disabled>Packages</BreadcrumbItem>
            </Breadcrumb>
          </StackItem>
          <StackItem className={classes.titleWrapper}>
            <Title headingLevel='h1' ouiaId='lightwell-packages-header'>
              {repository?.name}
            </Title>
          </StackItem>
        </Stack>
      </Grid>
      <Grid className={`${spacing.pxLg} ${spacing.ptMd}`}>
        <EmptyTableState
          notFiltered
          itemName='packages'
          notFilteredBody='No packages are available in this repository yet.'
          clearFilters={() => {}}
        />
      </Grid>
    </>
  );
};

export default PackagesList;
