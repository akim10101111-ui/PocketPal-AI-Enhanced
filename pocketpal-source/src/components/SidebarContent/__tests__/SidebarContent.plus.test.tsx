import React from 'react';
import {Text} from 'react-native';

import {NavigationContainer} from '@react-navigation/native';
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import {cleanup, render} from '@testing-library/react-native';

import {SidebarContent} from '../SidebarContent';

const Screen = () => <Text>Screen</Text>;
const Drawer = createDrawerNavigator();

const renderSidebarContent = (props: DrawerContentComponentProps) => (
  <SidebarContent {...props} />
);

const TestNavigator = () => (
  <NavigationContainer>
    <Drawer.Navigator drawerContent={renderSidebarContent}>
      <Drawer.Screen name="Chat" component={Screen} />
    </Drawer.Navigator>
  </NavigationContainer>
);

describe('SidebarContent navigation', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps Pals and PocketPal Plus out of the main navigation', () => {
    const {getByTestId, queryByTestId, queryByText} = render(
      <TestNavigator />,
    );

    expect(getByTestId('sidebar-content')).toBeTruthy();
    expect(getByTestId('drawer-item-chat')).toBeTruthy();
    expect(getByTestId('drawer-item-models')).toBeTruthy();
    expect(getByTestId('drawer-item-settings')).toBeTruthy();
    expect(queryByTestId('drawer-item-pals')).toBeNull();
    expect(queryByTestId('drawer-item-plus')).toBeNull();
    expect(queryByText(/PocketPal Plus/i)).toBeNull();
  });
});
