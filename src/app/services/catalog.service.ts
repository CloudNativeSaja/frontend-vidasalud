import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class CatalogService {


  private apiUrl =
  'http://54.160.192.249:8080/api/bff/catalog';


  constructor(
    private http: HttpClient
  ){}


  getServices(): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.apiUrl}/services`
    );

  }


  getBoxes(): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.apiUrl}/boxes`
    );

  }


  getSlots(): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.apiUrl}/slots`
    );

  }

}