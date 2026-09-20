import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core';

import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';

import { provideRouter } from '@angular/router';

import {
  BrowserCacheLocation,
  InteractionType,
  IPublicClientApplication,
  PublicClientApplication
} from '@azure/msal-browser';

import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalGuardConfiguration,
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MsalService
} from '@azure/msal-angular';

import { routes } from './app.routes';


// ==========================================
// VIDA SALUD API
// ==========================================

const VIDA_SALUD_API_SCOPE =
  'api://964063ab-9c14-41ca-9ecb-9b6d3891e750/access_as_user';


// ==========================================
// MSAL INSTANCE
// ==========================================

export function MSALInstanceFactory(): IPublicClientApplication {

  return new PublicClientApplication({

    auth: {

      // VidaSalud-Frontend
      clientId: '953bb761-bf89-4695-9afe-04be8ed1c5c9',

      // Tenant appdemo1988
      authority:
        'https://login.microsoftonline.com/990d84ca-63d0-44d9-89f7-3515a5520b0c',

      // Desarrollo local
      redirectUri: 'http://localhost:4200',

      postLogoutRedirectUri: 'http://localhost:4200'
    },

    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage
    }

  });
}


// ==========================================
// MSAL GUARD
// ==========================================

export function MSALGuardConfigFactory(): MsalGuardConfiguration {

  return {

    interactionType: InteractionType.Redirect,

    authRequest: {

      scopes: [
        VIDA_SALUD_API_SCOPE
      ]

    }

  };
}


// ==========================================
// MSAL INTERCEPTOR
// ==========================================

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {

  const protectedResourceMap =
    new Map<string, Array<string>>();


  // Microsoft Graph
  protectedResourceMap.set(
    'https://graph.microsoft.com/v1.0/me',
    [
      'User.Read'
    ]
  );


 // BFF VidaSalud
protectedResourceMap.set(
  'http://54.160.192.249:8080',
  [
    VIDA_SALUD_API_SCOPE
  ]
);


  return {

    interactionType: InteractionType.Redirect,

    protectedResourceMap

  };

}


// ==========================================
// APP CONFIG
// ==========================================

export const appConfig: ApplicationConfig = {

  providers: [

    provideBrowserGlobalErrorListeners(),

    provideRouter(routes),

    provideHttpClient(
      withInterceptorsFromDi()
    ),


    // MSAL Interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },


    // MSAL Instance
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },


    // Inicialización MSAL
    provideAppInitializer(async () => {

      const msalInstance = inject(
        MSAL_INSTANCE
      ) as IPublicClientApplication;

      await msalInstance.initialize();

      await msalInstance.handleRedirectPromise();

    }),


    // Guard
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },


    // Interceptor config
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },


    MsalService,

    MsalGuard,

    MsalBroadcastService

  ]

};