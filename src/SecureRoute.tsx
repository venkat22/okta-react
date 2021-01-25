/*
 * Copyright (c) 2017-Present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

import * as React from 'react';
import { useOktaAuth, OnAuthRequiredFunction } from './OktaContext';
import { Route, useRouteMatch, RouteProps } from 'react-router-dom';

const SecureRoute: React.FC<{
  onAuthRequired?: OnAuthRequiredFunction;
} & RouteProps & React.HTMLAttributes<HTMLDivElement>> = ({ 
  onAuthRequired, 
  ...routeProps 
}) => { 
  const { oktaAuth, authState, _onAuthRequired } = useOktaAuth();
  const match = useRouteMatch(routeProps);
  const pendingLogin = React.useRef(false);

  React.useEffect(() => {
    const handleLogin = async () => {
      if (pendingLogin.current) {
        return;
      }

      pendingLogin.current = true;

      const oringinalUri = window.location.origin + match.url + window.location.search + window.location.hash;
      oktaAuth.setOriginalUri(oringinalUri);
      const onAuthRequiredFn = onAuthRequired || _onAuthRequired;
      if (onAuthRequiredFn) {
        await onAuthRequiredFn(oktaAuth);
      } else {
        await oktaAuth.signInWithRedirect();
      }
    };

    // Only process logic if the route matches
    if (!match) {
      return;
    }

    if (authState.isAuthenticated) {
      pendingLogin.current = false;
      return;
    }

    // Start login if app has decided it is not logged in and there is no pending signin
    if(!authState.isAuthenticated && !authState.isPending) { 
      handleLogin();
    }  
  }, [
    authState.isPending, 
    authState.isAuthenticated, 
    oktaAuth, 
    match, 
    onAuthRequired, 
    _onAuthRequired
  ]);

  if (!authState.isAuthenticated) {
    return null;
  }

  return (
    <Route
      { ...routeProps }
    />
  );
};

export default SecureRoute;
