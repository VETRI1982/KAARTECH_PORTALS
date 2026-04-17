import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';  

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf], 
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  username = '';
  password = '';
  message = '';

  constructor(private api: ApiService, private router: Router) {}

  login() {
  console.log("Clicked login");

  this.api.login({
    username: this.username,
    password: this.password
  }).subscribe({
    next: (res) => {
      console.log("Response:", res);

      if (res.ES_RESPONSE.STATUS === 'S') {

  const customerId = res.ES_RESPONSE.CUSTOMERID;

  localStorage.setItem('customerId', customerId);

  this.router.navigate(['/dashboard']);

} else {
  this.message = "Invalid credentials ❌";
}
    },
    error: (err) => {
      console.error("Error:", err);
      alert("Server Error 💀");
    }
  });
}
}