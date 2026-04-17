import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ApiService } from '../../services/api';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js'; 
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  customerId = '';
  activeTab = 'dashboard';
  isProfileDropdownOpen = false;
  today = new Date();

  // Data
  summary: any = null;
  profile: any = null;
  deliveries: any[] = [];
  invoices: any[] = [];
  payments: any[] = [];
  memos: any[] = [];
  salesOrders: any[] = [];

  // 📈 Chart Configuration Variables
  public revenueChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  public revenueChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
    }
  };

  constructor(
    private api: ApiService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
       Chart.register(...registerables); 
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.customerId = localStorage.getItem('customerId') || '';
      if (!this.customerId) {
        this.router.navigate(['/']);
        return;
      }
      this.loadAllData();
    }
  }

  loadAllData() {
    // 1. PROFILE
    this.api.getProfile(this.customerId).subscribe({
      next: (res: any) => { this.profile = res?.ES_PROFILE || null; },
      error: (err) => console.error("Profile Error:", err)
    });

    // 2. DASHBOARD
    this.api.getDashboardData(this.customerId).subscribe({
      next: (res: any) => {
        this.summary = res?.ES_SUMMARY || null;
        this.deliveries = res?.ET_DELIVERY?.item || [];
        this.salesOrders = res?.ET_SALES?.item || []; 
      },
      error: (err) => console.error("Dashboard Error:", err)
    });

    // 3. FINANCE (Chart logic is triggered here because it needs Invoice data)
    this.api.getFinance(this.customerId).subscribe({
      next: (res: any) => {
        this.invoices = res?.ET_INVOICE?.item || [];
        this.payments = res?.ET_PAYMENT?.item || [];
        this.memos = res?.ET_MEMO?.item || [];
        
        // 🔥 Trigger Chart generation after data arrives
        this.generateRevenueChart();
      },
      error: (err) => console.error("Finance Error:", err)
    });
  }

  // --- HELPER METHODS ---

  generateRevenueChart() {
    const dataMap: { [key: string]: number } = {};
    
    // Group invoices by month
    this.invoices.forEach(inv => {
      const date = new Date(inv.BILLING_DATE);
      const month = date.toLocaleString('default', { month: 'short' });
      dataMap[month] = (dataMap[month] || 0) + parseFloat(inv.TOTAL_GROSS);
    });

    // Update the chart data object
    this.revenueChartData = {
      labels: Object.keys(dataMap),
      datasets: [{
        data: Object.values(dataMap),
        label: 'Revenue ($)',
        borderColor: '#2dd4bf', // Teal color
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  }

  scrollTo(sectionId: string) {
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }, 100);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.isProfileDropdownOpen = false;
  }

  toggleProfileDropdown() { this.isProfileDropdownOpen = !this.isProfileDropdownOpen; }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('customerId');
      this.router.navigate(['/']);
    }
  }

  downloadInvoice(invoiceNo: string) {
    if (isPlatformBrowser(this.platformId)) {
      this.api.getInvoicePdf(invoiceNo).subscribe({
        next: (res: any) => {
          const base64String = res.EV_PDF_BASE64;
          if (!base64String) { alert("Invoice file data is empty."); return; }

          const byteCharacters = atob(base64String);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Invoice_${invoiceNo}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => { console.error("PDF Download Error:", err); }
      });
    }
  }
}