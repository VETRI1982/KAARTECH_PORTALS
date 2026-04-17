import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  login(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data);
  }
  getDashboardData(customerId: string) {
  return this.http.get(`${this.baseUrl}/dashboard?customerId=${customerId}`);
}

getProfile(customerId: string) {
  return this.http.get(`${this.baseUrl}/profile?customerId=${customerId}`);
}

getFinance(customerId: string) {
  return this.http.get(`${this.baseUrl}/finance?customerId=${customerId}`);
}

getInvoicePdf(invoiceNo: string) {
  // Ensure this URL matches the route we added in Step 1
  return this.http.post('http://localhost:3000/get-invoice-pdf', { invoiceNo });
}
}