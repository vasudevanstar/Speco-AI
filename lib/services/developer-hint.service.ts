export interface StructuredRequirement {
  id: string; // FR-001
  questionCode: string; // Q-001
  questionId: string;
  moduleId: string;
  moduleName: string;
  originalQuestion: string;
  questionCategory: string;
  questionType: string;
  originalAnswer: string;
  answerDataType: string;
  answerTimestamp: string;
  sequence: number;
  isRequired: boolean;
  selectedOptions: string[];
  additionalExplanation?: string;

  requirementTitle: string;
  requirementDescription: string;
  requirementInterpretation: string;
  developerHint: string;
  technicalSpecification: string;
  inputRequirements: string;
  outputRequirements: string;
  dataType: string;
  validationRules: string[];
  businessRules: string[];
  frontendGuidance: string;
  backendGuidance: string;
  databaseConsiderations: string;
  errorHandling: string;
  acceptanceCriteria: string[];
  priority: 'Must Have' | 'Should Have' | 'Could Have' | "Won't Have";
  dependencies: string[];
  clarificationStatus: 'Confirmed User Requirement' | 'Developer Recommendation' | 'Clarification Required';
}

export class DeveloperHintService {
  private static instance: DeveloperHintService;

  static getInstance(): DeveloperHintService {
    if (!DeveloperHintService.instance) {
      DeveloperHintService.instance = new DeveloperHintService();
    }
    return DeveloperHintService.instance;
  }

  /**
   * Format original answer cleanly without altering user intent
   */
  formatOriginalAnswer(answer: any): { text: string; dataType: string; isProvided: boolean } {
    if (!answer) {
      return { text: 'Not specified / Pending input', dataType: 'N/A', isProvided: false };
    }

    const parts: string[] = [];
    let dataType = 'String';

    if (answer.selectedOptions) {
      let opts = answer.selectedOptions;
      if (typeof opts === 'string') {
        try {
          opts = JSON.parse(opts);
        } catch {}
      }
      if (Array.isArray(opts) && opts.length > 0) {
        parts.push(opts.join(', '));
        dataType = opts.length > 1 ? 'Array<String>' : 'String';
      } else if (typeof opts === 'string' && opts.trim()) {
        parts.push(opts.trim());
      }
    }

    if (answer.textValue && typeof answer.textValue === 'string' && answer.textValue.trim()) {
      if (!parts.includes(answer.textValue.trim())) {
        parts.push(answer.textValue.trim());
      }
    }

    if (answer.numericValue !== null && answer.numericValue !== undefined && answer.numericValue !== '') {
      parts.push(String(answer.numericValue));
      dataType = 'Number';
    }

    if (answer.additionalExplanation && answer.additionalExplanation.trim()) {
      parts.push(`(Note: ${answer.additionalExplanation.trim()})`);
    }

    const text = parts.join(' - ').trim();
    if (!text || text === '') {
      return { text: 'Not specified / Pending input', dataType: 'N/A', isProvided: false };
    }

    // Detect boolean
    if (['yes', 'no', 'true', 'false'].includes(text.toLowerCase())) {
      dataType = 'Boolean';
    }

    return { text, dataType, isProvided: true };
  }

  /**
   * Analyzes an answered question within the project context and generates
   * comprehensive, implementation-ready Developer Hints and technical specifications.
   */
  analyzeRequirement(
    project: any,
    module: any,
    question: any,
    rawAnswer: any,
    index: number
  ): StructuredRequirement {
    const seq = index + 1;
    const reqId = `FR-${seq.toString().padStart(3, '0')}`;
    const qCode = `Q-${seq.toString().padStart(3, '0')}`;
    const questionText = question.question || 'Requirement Question';
    const moduleName = module.name || 'General';
    const isRequired = question.required !== false;

    const formatted = this.formatOriginalAnswer(rawAnswer);
    const answerText = formatted.text;
    const isProvided = formatted.isProvided;
    const qLower = questionText.toLowerCase();
    const aLower = answerText.toLowerCase();
    const domainLower = `${project.industry || ''} ${project.title || ''} ${project.description || ''}`.toLowerCase();

    // Default Priority
    let priority: 'Must Have' | 'Should Have' | 'Could Have' | "Won't Have" = isRequired ? 'Must Have' : 'Should Have';
    let clarificationStatus: 'Confirmed User Requirement' | 'Developer Recommendation' | 'Clarification Required' = 
      isProvided ? 'Confirmed User Requirement' : 'Clarification Required';

    // Domain Specific Context
    let domainNotes = '';
    if (domainLower.includes('health') || domainLower.includes('hospital') || domainLower.includes('clinic') || domainLower.includes('patient')) {
      domainNotes = 'Healthcare domain: Enforce strict audit logging, patient data encryption at rest and in transit (HIPAA/GDPR compliance).';
    } else if (domainLower.includes('bank') || domainLower.includes('finan') || domainLower.includes('pay') || domainLower.includes('money')) {
      domainNotes = 'Financial domain: Enforce ACID transaction compliance, audit trails, and strict data masking for sensitive numbers.';
    } else if (domainLower.includes('retail') || domainLower.includes('shop') || domainLower.includes('pos') || domainLower.includes('ecommerce') || domainLower.includes('e-commerce')) {
      domainNotes = 'Retail/Commerce domain: Handle concurrent inventory reservations, cart persistence, and fast checkout execution.';
    } else if (domainLower.includes('crm') || domainLower.includes('saas')) {
      domainNotes = 'CRM/SaaS domain: Support multi-tenant isolation, searchable indexing, and soft-delete audit records.';
    }

    // Intelligent pattern analysis based on question topic and answer
    let title = `${moduleName}: ${questionText.replace(/\?$/, '')}`;
    let interpretation = '';
    let devHint = '';
    let techSpec = '';
    let inputReq = '';
    let outputReq = '';
    let validationRules: string[] = [];
    let businessRules: string[] = [];
    let frontendGuidance = '';
    let backendGuidance = '';
    let databaseConsiderations = '';
    let errorHandling = '';
    let acceptanceCriteria: string[] = [];
    let dependencies: string[] = [];

    // 1. MOBILE / PHONE NUMBER VALIDATION
    if (qLower.includes('mobile') || qLower.includes('phone') || (qLower.includes('digit') && (qLower.includes('number') || qLower.includes('contain')))) {
      title = `${moduleName}: Mobile Number Validation`;
      const digitsMatch = answerText.match(/\b\d+\b/);
      const digits = digitsMatch ? digitsMatch[0] : (aLower.includes('10') ? '10' : null);

      if (digits) {
        interpretation = `User requires mobile numbers to contain exactly ${digits} digits.`;
        techSpec = `The system shall accept mobile numbers containing exactly ${digits} digits and reject values with fewer or more digits.`;
        devHint = `Implement mobile number validation in both frontend and backend. Accept exactly ${digits} digits according to the specified requirement. Reject inputs containing fewer or more digits. Use appropriate input constraints (e.g. pattern="[0-9]{${digits}}" and maxLength=${digits}) and server-side validation. Store the mobile number using a string data type (VARCHAR) to preserve leading zeros, formatting, and avoid numeric integer conversion issues. ${domainNotes}`;
        inputReq = `Mobile number string (exactly ${digits} numeric characters).`;
        outputReq = `Sanitized mobile number saved to user profile or record; instant error feedback if invalid.`;
        validationRules = [
          `Must contain exactly ${digits} numeric digits (Regex: ^[0-9]{${digits}}$).`,
          `No whitespace, letters, or special characters permitted unless formatted with country code.`,
          isRequired ? `Field is mandatory; empty input must be rejected.` : `Optional field; if provided, validation applies.`
        ];
        acceptanceCriteria = [
          `A ${digits}-digit numeric value is accepted.`,
          `A value with ${Number(digits) - 1} digits is rejected.`,
          `A value with ${Number(digits) + 1} digits is rejected.`,
          `Non-numeric characters are rejected immediately.`,
          isRequired ? `Submitting empty field shows: "Mobile number is required".` : `Empty field submission is allowed if optional.`
        ];
      } else {
        interpretation = `User specified mobile validation preference: "${answerText}".`;
        techSpec = `The system shall validate mobile numbers conforming to the specified requirement: ${answerText}.`;
        devHint = `Implement robust mobile number validation on frontend and backend using international E.164 standards or specified country rules. Store as VARCHAR with proper indexing.`;
        validationRules = [`Must match format specified by: ${answerText}`];
        acceptanceCriteria = [`Values matching "${answerText}" are accepted.`, `Invalid phone inputs are rejected.`];
      }
      frontendGuidance = `Use an <input type="tel"> with pattern matching and real-time length counter. Auto-format or restrict non-digit keystrokes.`;
      backendGuidance = `Validate using regex prior to processing. Sanitize input to strip formatting before persisting.`;
      databaseConsiderations = `Store in database as VARCHAR(20) with unique index if phone number must be unique across accounts.`;
      errorHandling = `Display clear error: "Please enter a valid ${digits || ''}-digit mobile number."`;
    }

    // 2. EMAIL VALIDATION
    else if (qLower.includes('email') && (qLower.includes('validat') || qLower.includes('mandatory') || qLower.includes('unique') || qLower.includes('require'))) {
      title = `${moduleName}: Email Validation`;
      const isMandatory = aLower.includes('yes') || aLower.includes('true') || aLower.includes('mandatory') || isRequired;
      interpretation = `User requires email validation: ${answerText}.`;
      techSpec = `The system shall validate email addresses according to RFC 5322 format before accepting registration or saving the relevant record.`;
      devHint = `Implement email format validation on both frontend and backend. Reject invalid email formats and display a clear validation message. Normalize emails to lowercase before validation and storage to prevent duplicate accounts with different casing. If email uniqueness is required, enforce a UNIQUE constraint on the database column and handle duplicate insertion errors gracefully. ${domainNotes}`;
      inputReq = `Email address string.`;
      outputReq = `Normalized email address saved or clear validation error returned.`;
      validationRules = [
        `Must conform to standard email regex: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$`,
        `Maximum length 254 characters (RFC 5321).`,
        isMandatory ? `Field is mandatory; whitespace or empty submission is rejected.` : `Optional field.`
      ];
      acceptanceCriteria = [
        `Valid email format (e.g. user@example.com) is accepted.`,
        `Invalid email format (missing @, invalid domain, trailing dot) is rejected with clear message.`,
        `Duplicate emails are rejected with "Email address already registered" if uniqueness is configured.`
      ];
      frontendGuidance = `Use <input type="email"> with client-side pattern validation and blur validation trigger.`;
      backendGuidance = `Normalize to lowercase, validate with standard email validator library, and check database uniqueness before insert.`;
      databaseConsiderations = `VARCHAR(255) with UNIQUE INDEX on email column. Collation case-insensitive or store pre-lowercased.`;
      errorHandling = `Return HTTP 400 with "Please enter a valid email address." for malformed input; HTTP 409 for duplicate.`;
    }

    // 3. AUTHENTICATION & LOGIN MECHANISM
    else if (qLower.includes('login') || qLower.includes('auth') || qLower.includes('sign in')) {
      title = `${moduleName}: Authentication & Login Mechanism`;
      interpretation = `User specified login authentication methods: ${answerText}.`;
      techSpec = `The system shall authenticate registered users using the specified method(s): ${answerText}.`;
      devHint = `Implement an authentication flow supporting: ${answerText}. Validate user credentials securely, hash passwords using a robust algorithm (bcrypt, Argon2 with salt), and issue authenticated sessions or JWT tokens according to the application architecture. Do not store plain-text passwords. Implement rate limiting on login attempts to prevent brute force attacks. ${domainNotes}`;
      inputReq = `Credentials as specified (${answerText}).`;
      outputReq = `Authenticated session / JWT token upon success, or generic authentication failure message.`;
      validationRules = [
        `All required login fields must be supplied.`,
        `Rate limit failed login attempts (e.g., maximum 5 attempts per 15 minutes per IP/account).`
      ];
      acceptanceCriteria = [
        `Valid credentials for ${answerText} grant authenticated access and return authorized session.`,
        `Invalid credentials return HTTP 401 with generic message "Invalid email or password" to prevent user enumeration.`,
        `Tokens contain appropriate user claims and expire within standard duration.`
      ];
      frontendGuidance = `Create clean login form with password show/hide toggle and disabled submit button during request in flight.`;
      backendGuidance = `Hash and compare passwords asynchronously using bcrypt.compare. Issue signed JWT with expiration and secure HTTP-only cookies if session-based.`;
      databaseConsiderations = `Store password_hash VARCHAR(255), last_login TIMESTAMP, failed_attempts INT.`;
      errorHandling = `Return HTTP 401 for bad credentials, HTTP 429 when rate limit exceeded.`;
    }

    // 4. PASSWORD REQUIREMENTS / POLICIES
    else if (qLower.includes('password') && (qLower.includes('length') || qLower.includes('complex') || qLower.includes('policy') || qLower.includes('rule'))) {
      title = `${moduleName}: Password Complexity & Policy`;
      const lenMatch = answerText.match(/\b\d+\b/);
      const minLen = lenMatch ? lenMatch[0] : '8';
      interpretation = `User requires minimum password length of ${minLen} characters (Answer: ${answerText}).`;
      techSpec = `The system shall reject passwords containing fewer than ${minLen} characters.`;
      devHint = `Configure password validation to require at least ${minLen} characters. Enforce the exact same rule on both frontend and backend. Display an appropriate validation message when the password does not meet the minimum length. Use a strength indicator if recommended. Never log user passwords.`;
      inputReq = `Plain-text password string during registration/reset.`;
      outputReq = `Validation confirmation or specific password policy violation error.`;
      validationRules = [
        `Password length must be greater than or equal to ${minLen} characters.`,
        `Must not exceed 128 characters to prevent DoS via hashing algorithms.`
      ];
      acceptanceCriteria = [
        `Password with ${minLen} or more characters is accepted.`,
        `Password with ${Number(minLen) - 1} characters is rejected with message: "Password must be at least ${minLen} characters."`,
        `Spaces at beginning or end are trimmed or rejected according to security policy.`
      ];
      frontendGuidance = `Provide real-time password criteria checklist as user types.`;
      backendGuidance = `Enforce min-length check before hashing.`;
      databaseConsiderations = `Store hashed digest only; never store plaintext.`;
      errorHandling = `Return HTTP 400 with descriptive error: "Password must be at least ${minLen} characters."`;
    }

    // 5. APPOINTMENT / BOOKING / RESERVATION
    else if (qLower.includes('appoint') || qLower.includes('book') || qLower.includes('reserv') || qLower.includes('slot')) {
      title = `${moduleName}: Booking & Slot Management`;
      interpretation = `User requirement for scheduling/booking: ${answerText}.`;
      techSpec = `The system shall allow users to book available appointment slots according to specified rules (${answerText}) and prevent conflicting bookings.`;
      devHint = `Implement an appointment booking module with date and time selection. Retrieve available slots from the backend, validate availability before confirming a booking, and prevent double booking using server-side checks and database transaction locks (e.g. SELECT FOR UPDATE or unique slot constraints). Store timestamps in UTC. ${domainNotes}`;
      inputReq = `Selected date, time slot ID, provider/service ID, and user identifiers.`;
      outputReq = `Confirmed appointment record with unique booking reference code and status updated.`;
      validationRules = [
        `Selected date and time slot must be strictly in the future.`,
        `Slot must be currently marked as 'Available' in database.`,
        `Prevent overlapping reservations for the same resource.`
      ];
      acceptanceCriteria = [
        `Available date and time slots are displayed correctly to user.`,
        `Selected available slot is successfully confirmed upon user submission.`,
        `Simultaneous booking attempts for the same slot result in one success and one graceful "Slot no longer available" error.`
      ];
      frontendGuidance = `Interactive calendar / time-slot picker with disabled states for unavailable or past slots.`;
      backendGuidance = `Wrap booking in a database transaction with isolation level sufficient to prevent race-condition overbooking.`;
      databaseConsiderations = `Appointments table with composite index on (resource_id, start_time, status) and status ENUM('pending', 'confirmed', 'cancelled').`;
      errorHandling = `Return HTTP 409 Conflict if slot is taken concurrently; HTTP 400 if date is invalid.`;
    }

    // 6. GST / BILLING / TAXATION
    else if (qLower.includes('gst') || qLower.includes('tax') || qLower.includes('invoice') || qLower.includes('billing')) {
      title = `${moduleName}: Billing & Tax Compliance`;
      const isEnabled = aLower.includes('yes') || aLower.includes('enabled') || aLower.includes('true');
      interpretation = `User requirements for billing & tax: ${answerText}.`;
      techSpec = `The system shall ${isEnabled ? 'calculate and apply GST/tax rates compliant with specified regulations' : 'generate standard invoices without statutory tax levies'} as specified: ${answerText}.`;
      devHint = `Implement billing calculation logic supporting ${answerText}. Ensure decimal math uses fixed-point decimal arithmetic (e.g., BigDecimal or round to 2 decimals) to prevent floating-point rounding errors. Maintain audit trails for all generated invoices. ${domainNotes}`;
      inputReq = `Line items, quantities, unit prices, tax slabs/rates.`;
      outputReq = `Itemized invoice with subtotal, tax breakdown (CGST/SGST/IGST if applicable), and grand total.`;
      validationRules = [
        `Item quantities must be positive numbers.`,
        `Prices and tax rates must be non-negative decimals.`,
        `Calculated total must equal line items sum plus taxes minus discounts exactly.`
      ];
      acceptanceCriteria = [
        `Invoices are generated with accurate mathematical calculations to 2 decimal places.`,
        `Tax line items match selected tax percentage accurately.`,
        `Invoices are immutable once finalized.`
      ];
      frontendGuidance = `Display dynamic billing summary table with instant calculation on quantity change.`;
      backendGuidance = `Compute totals on server side; never trust client-calculated totals.`;
      databaseConsiderations = `Invoices and InvoiceItems tables with DECIMAL(12, 2) currency columns.`;
      errorHandling = `Reject invoice submission if line items are empty or total math does not reconcile.`;
    }

    // 7. PAYMENT GATEWAYS & TRANSACTIONS
    else if (qLower.includes('payment') || qLower.includes('gateway') || qLower.includes('upi') || qLower.includes('card')) {
      title = `${moduleName}: Payment Processing Integration`;
      interpretation = `User specified payment methods/gateways: ${answerText}.`;
      techSpec = `The system shall integrate and process payments via the specified methods: ${answerText}.`;
      devHint = `Integrate payment processing for: ${answerText}. Use webhook handlers with signature verification for asynchronous payment confirmations. Implement idempotent order update processing to prevent double credit. Never log raw credit card numbers or CVVs. ${domainNotes}`;
      inputReq = `Payment intent request with order ID, amount, currency, and payment method token.`;
      outputReq = `Payment confirmation status (Success, Failed, Pending) and gateway transaction reference ID.`;
      validationRules = [
        `Payment amount must be greater than zero and match server order total.`,
        `Webhook signatures must be verified before updating order state.`
      ];
      acceptanceCriteria = [
        `User can initiate payment using ${answerText}.`,
        `Successful payment webhook transitions order status to 'Paid'.`,
        `Failed payment prompts user to retry with an alternate method.`
      ];
      frontendGuidance = `Embed payment gateway SDK/modal with loading spinner and transaction result page.`;
      backendGuidance = `Handle webhooks with HMAC signature validation. Mark orders as paid only on confirmed webhook.`;
      databaseConsiderations = `Payments table with transaction_id, gateway_name, amount DECIMAL(10,2), status ENUM.`;
      errorHandling = `Handle timeout and declined transaction codes with user-friendly error messages.`;
    }

    // 8. ROLES, PERMISSIONS & ACCESS CONTROL
    else if (qLower.includes('role') || qLower.includes('permission') || qLower.includes('access') || qLower.includes('rbac')) {
      title = `${moduleName}: Role-Based Access Control`;
      interpretation = `User defined roles/permissions: ${answerText}.`;
      techSpec = `The system shall enforce role-based access control according to configured roles: ${answerText}.`;
      devHint = `Implement Role-Based Access Control (RBAC) supporting the roles and permissions identified: ${answerText}. Protect API endpoints using authorization middleware that verifies user permissions before executing controller logic. Block unauthorized requests with HTTP 403 Forbidden.`;
      inputReq = `User session/token containing role claim; target resource ID.`;
      outputReq = `Authorized resource data or HTTP 403 Forbidden denial.`;
      validationRules = [
        `User must possess the designated role or permission required for the action.`,
        `Admin privileges must be guarded with explicit server-side role validation.`
      ];
      acceptanceCriteria = [
        `Users assigned authorized roles can access designated views and actions.`,
        `Users without required permissions are blocked with clear "Access Denied" notice.`
      ];
      frontendGuidance = `Conditionally render UI buttons/menus based on current user role permissions.`;
      backendGuidance = `Add authorization middleware (e.g. checkPermission('role:admin')) on all protected API routes.`;
      databaseConsiderations = `Roles table, Permissions table, and UserRoles join table.`;
      errorHandling = `Return HTTP 403 Forbidden with "You do not have permission to perform this action."`;
    }

    // 9. GENERAL / OTHER REQUIREMENTS
    else {
      title = `${moduleName}: ${questionText.replace(/\?$/, '')}`;
      if (aLower === 'yes' || aLower === 'true') {
        interpretation = `User explicitly enabled and requires this feature.`;
        techSpec = `The system shall provide ${questionText.replace(/\?$/, '').toLowerCase()} as a standard operational feature.`;
        devHint = `Implement the required functionality in the ${moduleName} module as approved by the user. Ensure modular separation and clean API contracts. ${domainNotes}`;
      } else if (aLower === 'no' || aLower === 'false') {
        interpretation = `User explicitly opted out or disabled this feature.`;
        techSpec = `The system shall exclude or disable ${questionText.replace(/\?$/, '').toLowerCase()} per user specification.`;
        devHint = `Do not build or expose this capability in the primary workflow. Keep backend configuration disabled by default.`;
        priority = "Won't Have";
      } else if (isProvided) {
        interpretation = `User configured this requirement with specific value: "${answerText}".`;
        techSpec = `The system shall implement ${questionText.replace(/\?$/, '').toLowerCase()} conforming to: ${answerText}.`;
        devHint = `Implement ${moduleName} logic respecting user preference: "${answerText}". Validate inputs on frontend and backend, write unit tests covering the specified criteria, and ensure error handling provides actionable feedback. ${domainNotes}`;
      } else {
        interpretation = `User has not yet specified a value for this requirement.`;
        techSpec = `The system shall implement ${questionText.replace(/\?$/, '').toLowerCase()} following standard domain best practices pending user clarification.`;
        devHint = `Clarification Required: Confirm exact user expectation for ${questionText} before finalizing technical implementation.`;
        clarificationStatus = 'Clarification Required';
      }

      inputReq = `Parameters required for ${questionText.replace(/\?$/, '')}.`;
      outputReq = `Successful execution of ${moduleName} workflow or status update.`;
      validationRules = [
        isProvided ? `Input must conform to user specification: ${answerText}` : `Standard domain validation applies pending clarification.`,
        isRequired ? `Field is required.` : `Optional field.`
      ];
      acceptanceCriteria = [
        `The system behaves in accordance with user answer: "${answerText}".`,
        `Edge cases and invalid inputs are handled with appropriate error messages.`
      ];
      frontendGuidance = `Design intuitive UI controls in ${moduleName} to capture and present this information.`;
      backendGuidance = `Implement service method in ${moduleName} service layer with proper error handling and logging.`;
      databaseConsiderations = `Store associated entity attributes in database with appropriate data types.`;
      errorHandling = `Return HTTP 400 for bad input, HTTP 500 with sanitized message for unexpected errors.`;
    }

    return {
      id: reqId,
      questionCode: qCode,
      questionId: question.id || `q-${seq}`,
      moduleId: module.id || `m-${seq}`,
      moduleName,
      originalQuestion: questionText,
      questionCategory: moduleName,
      questionType: question.type || 'text',
      originalAnswer: answerText,
      answerDataType: formatted.dataType,
      answerTimestamp: rawAnswer?.updatedAt || rawAnswer?.createdAt || new Date().toISOString(),
      sequence: seq,
      isRequired,
      selectedOptions: rawAnswer?.selectedOptions || [],
      additionalExplanation: rawAnswer?.additionalExplanation || undefined,

      requirementTitle: title,
      requirementDescription: `Based on user response to "${questionText}": ${answerText}`,
      requirementInterpretation: interpretation,
      developerHint: devHint,
      technicalSpecification: techSpec,
      inputRequirements: inputReq,
      outputRequirements: outputReq,
      dataType: formatted.dataType,
      validationRules,
      businessRules,
      frontendGuidance,
      backendGuidance,
      databaseConsiderations,
      errorHandling,
      acceptanceCriteria,
      priority,
      dependencies,
      clarificationStatus,
    };
  }
}

export const developerHintService = DeveloperHintService.getInstance();

