import { Module, SubModule, Feature } from '../types';

export const authenticationModule: Module = {
  id: 'auth',
  name: 'Authentication & Security',
  description: 'User authentication, authorization, and security controls',
  subModules: [
    {
      id: 'auth-login',
      name: 'Login Mechanisms',
      features: [
        { id: 'auth-login-basic', name: 'Username/Password Login', required: true },
        { id: 'auth-login-otp-mobile', name: 'Mobile OTP Login', required: false },
        { id: 'auth-login-otp-email', name: 'Email OTP Login', required: false },
        { id: 'auth-login-social', name: 'Social Login (Google, Facebook, Apple)', required: false },
        { id: 'auth-login-mfa', name: 'Multi-Factor Authentication (MFA/2FA)', required: false },
      ],
    },
    {
      id: 'auth-password',
      name: 'Password Management',
      features: [
        { id: 'auth-password-reset', name: 'Password Reset Flow', required: true },
        { id: 'auth-password-policy', name: 'Password Policy Enforcement', required: false },
        { id: 'auth-password-change', name: 'Change Password', required: true },
      ],
    },
    {
      id: 'auth-session',
      name: 'Session Management',
      features: [
        { id: 'auth-session-timeout', name: 'Session Timeout Configuration', required: true },
        { id: 'auth-session-concurrent', name: 'Concurrent Session Control', required: false },
        { id: 'auth-session-device', name: 'Device Management', required: false },
      ],
    },
  ],
};

export const userManagementModule: Module = {
  id: 'user-mgmt',
  name: 'User & Role Management',
  description: 'User profiles, roles, permissions, and organization structure',
  subModules: [
    {
      id: 'user-profile',
      name: 'User Profiles',
      features: [
        { id: 'user-profile-basic', name: 'Basic Profile Management', required: true },
        { id: 'user-profile-kyc', name: 'KYC Verification', required: false },
        { id: 'user-profile-address', name: 'Multiple Address Management', required: false },
      ],
    },
    {
      id: 'role-mgmt',
      name: 'Role Management',
      features: [
        { id: 'role-mgmt-def', name: 'Role Definition', required: true },
        { id: 'role-mgmt-perm', name: 'Permission Matrix', required: true },
        { id: 'role-mgmt-custom', name: 'Custom Role Creation', required: false },
      ],
    },
    {
      id: 'org-structure',
      name: 'Organization Structure',
      features: [
        { id: 'org-structure-branch', name: 'Multi-Branch Support', required: false },
        { id: 'org-structure-dept', name: 'Department Management', required: false },
        { id: 'org-structure-hierarchy', name: 'User Hierarchy', required: false },
      ],
    },
  ],
};

export const billingModule: Module = {
  id: 'billing',
  name: 'Billing & Orders',
  description: 'Order management, invoicing, and billing operations',
  subModules: [
    {
      id: 'billing-order',
      name: 'Order Management',
      features: [
        { id: 'billing-order-create', name: 'Create Order', required: true },
        { id: 'billing-order-modify', name: 'Modify Order', required: true },
        { id: 'billing-order-cancel', name: 'Cancel Order', required: true },
        { id: 'billing-order-track', name: 'Order Tracking', required: false },
        { id: 'billing-order-return', name: 'Return & Refund', required: false },
      ],
    },
    {
      id: 'billing-invoice',
      name: 'Invoice Generation',
      features: [
        { id: 'billing-invoice-gen', name: 'Auto Invoice Generation', required: true },
        { id: 'billing-invoice-gst', name: 'GST Invoice', required: false },
        { id: 'billing-invoice-einv', name: 'E-Invoice Generation', required: false },
        { id: 'billing-invoice-custom', name: 'Custom Invoice Templates', required: false },
        { id: 'billing-invoice-digital', name: 'Digital Invoice Delivery', required: true },
      ],
    },
    {
      id: 'billing-payment',
      name: 'Payment Processing',
      features: [
        { id: 'billing-payment-cash', name: 'Cash Payments', required: true },
        { id: 'billing-payment-card', name: 'Card Payments', required: false },
        { id: 'billing-payment-upi', name: 'UPI Payments', required: false },
        { id: 'billing-payment-credit', name: 'Credit/Credit Note', required: false },
        { id: 'billing-payment-split', name: 'Split Payments', required: false },
        { id: 'billing-payment-partial', name: 'Partial Payments', required: false },
      ],
    },
    {
      id: 'billing-gst',
      name: 'GST Compliance',
      features: [
        { id: 'billing-gst-slabs', name: 'GST Slab Configuration (5%, 12%, 18%, 28%)', required: false },
        { id: 'billing-gst-hsn', name: 'HSN Code Mapping', required: false },
        { id: 'billing-gst-revcharge', name: 'Reverse Charge Mechanism', required: false },
        { id: 'billing-gst-tds', name: 'TDS Deduction', required: false },
        { id: 'billing-gst-gstr', name: 'GSTR-1 Filing Support', required: false },
      ],
    },
  ],
};

export const inventoryModule: Module = {
  id: 'inventory',
  name: 'Inventory & Purchasing',
  description: 'Product catalog, stock management, and procurement',
  subModules: [
    {
      id: 'inv-product',
      name: 'Product Management',
      features: [
        { id: 'inv-product-basic', name: 'Basic Product Information', required: true },
        { id: 'inv-product-variant', name: 'Product Variants (Size, Color)', required: false },
        { id: 'inv-product-image', name: 'Product Images & Gallery', required: false },
        { id: 'inv-product-barcode', name: 'Barcode/UPC Support', required: false },
        { id: 'inv-product-batch', name: 'Batch/Lot Tracking', required: false },
      ],
    },
    {
      id: 'inv-stock',
      name: 'Stock Management',
      features: [
        { id: 'inv-stock-track', name: 'Real-time Stock Tracking', required: true },
        { id: 'inv-stock-low', name: 'Low Stock Alerts', required: true },
        { id: 'inv-stock-location', name: 'Warehouse/Bin Location', required: false },
        { id: 'inv-stock-transfer', name: 'Stock Transfer Between Locations', required: false },
        { id: 'inv-stock-adjust', name: 'Stock Adjustment & Audit', required: false },
      ],
    },
    {
      id: 'inv-purchase',
      name: 'Purchase Management',
      features: [
        { id: 'inv-purchase-order', name: 'Purchase Order Creation', required: false },
        { id: 'inv-purchase-grn', name: 'Goods Receipt Note (GRN)', required: false },
        { id: 'inv-purchase-vendor', name: 'Vendor Management', required: false },
        { id: 'inv-purchase-auto', name: 'Auto Reorder Points', required: false },
      ],
    },
  ],
};

export const pricingModule: Module = {
  id: 'pricing',
  name: 'Pricing & Promotions',
  description: 'Pricing rules, discounts, offers, and loyalty programs',
  subModules: [
    {
      id: 'pricing-retail',
      name: 'Retail Pricing',
      features: [
        { id: 'pricing-retail-mrp', name: 'MRP-based Pricing', required: false },
        { id: 'pricing-retail-fixed', name: 'Fixed Price Management', required: true },
        { id: 'pricing-retail-tier', name: 'Tiered Pricing', required: false },
      ],
    },
    {
      id: 'pricing-wholesale',
      name: 'Wholesale Pricing',
      features: [
        { id: 'pricing-wholesale-tier', name: 'Volume-based Wholesale Pricing', required: false },
        { id: 'pricing-wholesale-customer', name: 'Customer-specific Pricing', required: false },
        { id: 'pricing-wholesale-min', name: 'Minimum Order Quantity', required: false },
      ],
    },
    {
      id: 'pricing-discount',
      name: 'Discounts & Offers',
      features: [
        { id: 'pricing-discount-percent', name: 'Percentage Discounts', required: true },
        { id: 'pricing-discount-amount', name: 'Fixed Amount Discounts', required: true },
        { id: 'pricing-discount-bogo', name: 'Buy One Get One (BOGO)', required: false },
        { id: 'pricing-discount-coupon', name: 'Coupon/ Promo Codes', required: false },
        { id: 'pricing-discount-seasonal', name: 'Seasonal/ Festival Offers', required: false },
      ],
    },
    {
      id: 'pricing-loyalty',
      name: 'Loyalty & Rewards',
      features: [
        { id: 'pricing-loyalty-points', name: 'Loyalty Points System', required: false },
        { id: 'pricing-loyalty-redeem', name: 'Points Redemption', required: false },
        { id: 'pricing-loyalty-tier', name: 'Customer Tier System', required: false },
      ],
    },
  ],
};

export const serviceModule: Module = {
  id: 'service',
  name: 'Service Management',
  description: 'Service bookings, job cards, and service center operations',
  subModules: [
    {
      id: 'service-booking',
      name: 'Service Booking',
      features: [
        { id: 'service-booking-create', name: 'Create Service Booking', required: true },
        { id: 'service-booking-schedule', name: 'Schedule & Slot Management', required: false },
        { id: 'service-booking-reschedule', name: 'Reschedule/Cancel Booking', required: true },
        { id: 'service-booking-walkin', name: 'Walk-in Service Request', required: false },
      ],
    },
    {
      id: 'service-jobcard',
      name: 'Job Card Management',
      features: [
        { id: 'service-jobcard-create', name: 'Job Card Creation', required: true },
        { id: 'service-jobcard-status', name: 'Status Updates', required: true },
        { id: 'service-jobcard-parts', name: 'Parts Used Tracking', required: false },
        { id: 'service-jobcard-tech', name: 'Technician Assignment', required: false },
        { id: 'service-jobcard-estimate', name: 'Estimate & Approval', required: false },
      ],
    },
    {
      id: 'service-warranty',
      name: 'Warranty Management',
      features: [
        { id: 'service-warranty-track', name: 'Warranty Tracking', required: false },
        { id: 'service-warranty-claim', name: 'Warranty Claims Processing', required: false },
        { id: 'service-warranty-extend', name: 'Extended Warranty Options', required: false },
      ],
    },
  ],
};

export const notificationsModule: Module = {
  id: 'notifications',
  name: 'Notifications & Communication',
  description: 'Alerts, messages, and multi-channel communication',
  subModules: [
    {
      id: 'notif-push',
      name: 'Push Notifications',
      features: [
        { id: 'notif-push-mobile', name: 'Mobile Push Notifications', required: false },
        { id: 'notif-push-web', name: 'Web Push Notifications', required: false },
      ],
    },
    {
      id: 'notif-sms',
      name: 'SMS Notifications',
      features: [
        { id: 'notif-sms-trans', name: 'Transactional SMS (OTP, Alerts)', required: false },
        { id: 'notif-sms-prom', name: 'Promotional SMS', required: false },
      ],
    },
    {
      id: 'notif-email',
      name: 'Email Notifications',
      features: [
        { id: 'notif-email-trans', name: 'Transactional Emails', required: false },
        { id: 'notif-email-news', name: 'Newsletter & Campaigns', required: false },
      ],
    },
    {
      id: 'notif-whatsapp',
      name: 'WhatsApp Business',
      features: [
        { id: 'notif-whatsapp-api', name: 'WhatsApp API Integration', required: false },
        { id: 'notif-whatsapp-template', name: 'Template Messages', required: false },
      ],
    },
  ],
};

export const reportingModule: Module = {
  id: 'reporting',
  name: 'Reporting & Analytics',
  description: 'Dashboards, reports, and business intelligence',
  subModules: [
    {
      id: 'report-dashboard',
      name: 'Dashboards',
      features: [
        { id: 'report-dashboard-sales', name: 'Sales Dashboard', required: true },
        { id: 'report-dashboard-inventory', name: 'Inventory Dashboard', required: false },
        { id: 'report-dashboard-finance', name: 'Financial Dashboard', required: false },
        { id: 'report-dashboard-custom', name: 'Custom Widget Dashboard', required: false },
      ],
    },
    {
      id: 'report-standard',
      name: 'Standard Reports',
      features: [
        { id: 'report-sales', name: 'Sales Reports', required: true },
        { id: 'report-inventory', name: 'Inventory Reports', required: false },
        { id: 'report-gst', name: 'GST Tax Reports', required: false },
        { id: 'report-customer', name: 'Customer Reports', required: false },
        { id: 'report-employee', name: 'Employee Performance Reports', required: false },
      ],
    },
    {
      id: 'report-analytics',
      name: 'Advanced Analytics',
      features: [
        { id: 'report-analytics-trend', name: 'Trend Analysis', required: false },
        { id: 'report-analytics-forecast', name: 'Sales Forecasting', required: false },
        { id: 'report-analytics-customer', name: 'Customer Segmentation', required: false },
      ],
    },
    {
      id: 'report-export',
      name: 'Report Export',
      features: [
        { id: 'report-export-pdf', name: 'PDF Export', required: true },
        { id: 'report-export-excel', name: 'Excel/CSV Export', required: true },
        { id: 'report-export-sched', name: 'Scheduled Report Delivery', required: false },
      ],
    },
  ],
};

export const integrationsModule: Module = {
  id: 'integrations',
  name: 'Integrations & APIs',
  description: 'Third-party integrations and API management',
  subModules: [
    {
      id: 'int-payment',
      name: 'Payment Gateway',
      features: [
        { id: 'int-payment-razorpay', name: 'Razorpay Integration', required: false },
        { id: 'int-payment-stripe', name: 'Stripe Integration', required: false },
        { id: 'int-payment-paytm', name: 'Paytm Integration', required: false },
        { id: 'int-payment-custom', name: 'Custom Payment Gateway', required: false },
      ],
    },
    {
      id: 'int-shipping',
      name: 'Shipping & Logistics',
      features: [
        { id: 'int-shipping-tracking', name: 'Shipment Tracking', required: false },
        { id: 'int-shipping-label', name: 'Label Generation', required: false },
        { id: 'int-shipping-rate', name: 'Rate Calculator Integration', required: false },
      ],
    },
    {
      id: 'int-accounting',
      name: 'Accounting Software',
      features: [
        { id: 'int-account-tally', name: 'Tally Integration', required: false },
        { id: 'int-account-zoho', name: 'Zoho Books Integration', required: false },
        { id: 'int-account-quickbooks', name: 'QuickBooks Integration', required: false },
      ],
    },
    {
      id: 'int-gst',
      name: 'GST & Compliance APIs',
      features: [
        { id: 'int-gst-filing', name: 'GST Return Filing API', required: false },
        { id: 'int-gst-einv', name: 'E-Invoice API Integration', required: false },
        { id: 'int-gst-eway', name: 'E-Way Bill Generation', required: false },
      ],
    },
    {
      id: 'int-ecom',
      name: 'E-commerce Platforms',
      features: [
        { id: 'int-ecom-shopify', name: 'Shopify Sync', required: false },
        { id: 'int-ecom-woocommerce', name: 'WooCommerce Sync', required: false },
        { id: 'int-ecom-amazon', name: 'Amazon/Flipkart Integration', required: false },
      ],
    },
  ],
};

export const deploymentModule: Module = {
  id: 'deployment',
  name: 'Deployment & Platforms',
  description: 'Platform requirements, deployment model, and infrastructure',
  subModules: [
    {
      id: 'deploy-platform',
      name: 'Platform Coverage',
      features: [
        { id: 'deploy-platform-android', name: 'Android Application', required: true },
        { id: 'deploy-platform-ios', name: 'iOS Application', required: false },
        { id: 'deploy-platform-web', name: 'Web Application (PWA)', required: false },
        { id: 'deploy-platform-admin', name: 'Admin Dashboard (Web)', required: true },
      ],
    },
    {
      id: 'deploy-model',
      name: 'Deployment Model',
      features: [
        { id: 'deploy-model-cloud', name: 'Cloud Deployment (SaaS)', required: false },
        { id: 'deploy-model-onprem', name: 'On-Premise Deployment', required: false },
        { id: 'deploy-model-hybrid', name: 'Hybrid Model', required: false },
      ],
    },
    {
      id: 'deploy-tech',
      name: 'Technical Stack',
      features: [
        { id: 'deploy-tech-offline', name: 'Offline Capability', required: false },
        { id: 'deploy-tech-sync', name: 'Data Synchronization', required: false },
        { id: 'deploy-tech-perf', name: 'Performance Requirements', required: true },
      ],
    },
  ],
};

export const allModules: Module[] = [
  authenticationModule,
  userManagementModule,
  billingModule,
  inventoryModule,
  pricingModule,
  serviceModule,
  notificationsModule,
  reportingModule,
  integrationsModule,
  deploymentModule,
];
