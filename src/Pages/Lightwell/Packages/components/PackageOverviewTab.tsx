import {
  ClipboardCopy,
  ClipboardCopyVariant,
  Content,
  Flex,
  Stack,
  StackItem,
  Tab,
  TabContent,
  Tabs,
  TabTitleText,
  Title,
} from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { createRef, useMemo, useState } from 'react';

import { ConnectSnippetTab } from '../../Repositories/components/connectSnippets';
import {
  getMavenPackageUsageSnippetTabs,
  getPythonPackageUsageSnippetTabs,
} from './packageDependencySnippets';

type PackageOverviewTabProps = {
  isMaven: boolean;
  group: string;
  name: string;
  latestRelease: string;
  hasRelease: boolean;
  summary?: string;
  sourceUrl?: string;
};

const PackageOverviewTab = ({
  isMaven,
  group,
  name,
  latestRelease,
  hasRelease,
  summary,
  sourceUrl = '',
}: PackageOverviewTabProps) => {
  const tabs = useMemo(
    () =>
      isMaven
        ? getMavenPackageUsageSnippetTabs({
            group,
            name,
            release: latestRelease,
            sourceUrl,
          })
        : getPythonPackageUsageSnippetTabs({
            name,
            release: latestRelease,
            sourceUrl,
          }),
    [isMaven, group, name, latestRelease, sourceUrl],
  );
  const [activeTabKey, setActiveTabKey] = useState(tabs[0]?.eventKey ?? '');

  const tabRefs = useMemo(
    () =>
      tabs.reduce(
        (refs, tab) => {
          refs[tab.eventKey] = createRef<HTMLElement>();
          return refs;
        },
        {} as Record<string, React.RefObject<HTMLElement>>,
      ),
    [tabs],
  );

  const renderTabPanel = (tab: ConnectSnippetTab) => (
    <Stack hasGutter>
      {tab.snippets.map((snippet) => (
        <StackItem key={snippet.label}>
          <ClipboardCopy
            isReadOnly
            isCode
            hoverTip='Copy'
            clickTip='Copied'
            variant={ClipboardCopyVariant.expansion}
            isExpanded
          >
            {snippet.code}
          </ClipboardCopy>
        </StackItem>
      ))}
    </Stack>
  );

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
      <Stack hasGutter>
        <Title headingLevel='h2' size='lg'>
          About this package
        </Title>
        <Content>
          <p>{summary ?? 'Package description not yet available.'}</p>
          {hasRelease ? (
            <p>
              This package has been rebuilt by Red Hat with backported fixes for known
              vulnerabilities. The upstream version is pinned and Red Hat applies security patches
              as sequential releases (.rhlw suffix).
            </p>
          ) : (
            <p>
              This package has been rebuilt from source by Red Hat with no modifications. Multiple
              upstream versions are available, each verified end-to-end through the Red Hat build
              pipeline.
            </p>
          )}
        </Content>
      </Stack>
      <Stack hasGutter>
        <Title headingLevel='h2' size='lg'>
          How to use
        </Title>
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_, eventKey) => setActiveTabKey(eventKey as string)}
          aria-label='Package dependency snippets'
          ouiaId='lightwell-package-dependency-tabs'
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.eventKey}
              eventKey={tab.eventKey}
              title={<TabTitleText>{tab.title}</TabTitleText>}
              tabContentRef={tabRefs[tab.eventKey]}
              ouiaId={`lightwell-dependency-tab-${tab.eventKey}`}
            />
          ))}
        </Tabs>
        {tabs.map((tab, index) => (
          <TabContent
            key={tab.eventKey}
            eventKey={tab.eventKey}
            id={`lightwell-dependency-panel-${tab.eventKey}`}
            aria-label={tab.title}
            ref={tabRefs[tab.eventKey]}
            hidden={index > 0}
            className={spacing.ptSm}
          >
            {renderTabPanel(tab)}
          </TabContent>
        ))}
      </Stack>
    </Flex>
  );
};

export default PackageOverviewTab;
