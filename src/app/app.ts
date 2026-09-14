import { Component, inject, OnInit } from '@angular/core';

import {
  MsalBroadcastService,
  MsalService
} from '@azure/msal-angular';

import {
  AuthenticationResult,
  EventMessage,
  EventType
} from '@azure/msal-browser';

import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  private msalService = inject(MsalService);
  private msalBroadcastService = inject(MsalBroadcastService);

  isLoggedIn = false;
  userName = '';

  ngOnInit(): void {

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter(
          (msg: EventMessage) =>
            msg.eventType === EventType.INITIALIZE_END ||
            msg.eventType === EventType.LOGIN_SUCCESS
        )
      )
      .subscribe((result: EventMessage) => {

        if (result.eventType === EventType.LOGIN_SUCCESS) {
          const payload = result.payload as AuthenticationResult;

          this.msalService.instance.setActiveAccount(
            payload.account
          );
        }

        this.checkLoginStatus();
      });

    this.checkLoginStatus();
  }

  private checkLoginStatus(): void {

    const accounts =
      this.msalService.instance.getAllAccounts();

    let activeAccount =
      this.msalService.instance.getActiveAccount();

    if (!activeAccount && accounts.length > 0) {
      activeAccount = accounts[0];

      this.msalService.instance.setActiveAccount(
        activeAccount
      );
    }

    this.isLoggedIn = !!activeAccount;

    this.userName =
      activeAccount?.name ??
      activeAccount?.username ??
      '';
  }

  login(): void {
    this.msalService.loginRedirect();
  }

  logout(): void {
    this.msalService.logoutRedirect();
  }
}