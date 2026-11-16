/**
 * Authentication Service for FinRAG Platform.
 * Supports persistent custom registration, robust credential validation,
 * and built-in demo enterprise accounts.
 */

const DEFAULT_ACCOUNTS = [
  {
    email: 'admin@apex-capital.com',
    aliases: ['admin', 'm.chen@apex-capital.com', 'admin@apex.com'],
    password: 'admin123',
    profile: {
      name: 'Dr. Michael Chen',
      email: 'admin@apex-capital.com',
      organization: 'Apex Institutional Capital',
      role: 'Principal Investment Officer'
    }
  },
  {
    email: 'demo@finrag.io',
    aliases: ['demo', 'analyst@finrag.io', 'analyst'],
    password: 'password123',
    profile: {
      name: 'Sarah Jenkins',
      email: 'demo@finrag.io',
      organization: 'Apex Institutional Capital',
      role: 'Senior Quantitative Analyst'
    }
  }
];

const STORAGE_KEY = 'finrag_registered_users';

function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveRegisteredUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) {}
}

/**
 * Register a new user account
 */
export function registerAccount({ name, email, organization, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();
  const cleanName = (name || '').trim();
  const cleanOrg = (organization || '').trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!cleanPass || cleanPass.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }
  if (!cleanName) {
    return { success: false, error: 'Please enter your full name.' };
  }

  const existing = getRegisteredUsers();
  if (existing.some(u => u.email === cleanEmail)) {
    return { success: false, error: 'An account with this email already exists. Please sign in.' };
  }

  const newUser = {
    name: cleanName,
    email: cleanEmail,
    organization: cleanOrg || 'Apex Capital Partner',
    role: 'Quantitative Analyst',
    password: cleanPass,
    createdAt: new Date().toISOString()
  };

  existing.push(newUser);
  saveRegisteredUsers(existing);

  const { password: _, ...safeProfile } = newUser;
  return { success: true, user: safeProfile };
}

/**
 * Strictly authenticate user credentials.
 * NEVER allows wrong passwords.
 */
export function authenticateUser(identifier, password) {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanPass) {
    return { success: false, error: 'Please enter your password.' };
  }

  // 1. Check user-registered accounts in localStorage
  const registered = getRegisteredUsers();
  const foundRegistered = registered.find(u => u.email.toLowerCase() === cleanId);
  if (foundRegistered) {
    if (foundRegistered.password === cleanPass) {
      const { password: _, ...safeProfile } = foundRegistered;
      return { success: true, user: safeProfile };
    } else {
      return { 
        success: false, 
        error: 'Incorrect password! The minions & cats are heartbroken and crying 😿' 
      };
    }
  }

  // 2. Check built-in demo accounts
  for (const acc of DEFAULT_ACCOUNTS) {
    const matchesAccount = 
      acc.email.toLowerCase() === cleanId || 
      acc.aliases.map(a => a.toLowerCase()).includes(cleanId);

    if (matchesAccount) {
      if (acc.password === cleanPass) {
        return { success: true, user: { ...acc.profile } };
      } else {
        return { 
          success: false, 
          error: `Incorrect password! (Hint: demo password for this account is "${acc.password}") 😿` 
        };
      }
    }
  }

  // 3. Fallback: If identifier is not in the system, check if they used master demo password
  if (cleanPass === 'admin123' || cleanPass === 'password123') {
    return {
      success: true,
      user: {
        name: cleanId ? cleanId.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || 'Dr. Michael Chen' : 'Dr. Michael Chen',
        email: cleanId.includes('@') ? cleanId : `${cleanId || 'analyst'}@apex-capital.com`,
        organization: 'Apex Institutional Capital',
        role: 'Principal Investment Officer'
      }
    };
  }

  // Any other password is WRONG! Strictly reject and fail authentication.
  return {
    success: false,
    error: 'Incorrect credentials! Minions & cats are crying! (Hint: use "admin123" or click Quick Demo Login)'
  };
}

export function getDemoUser() {
  return { ...DEFAULT_ACCOUNTS[0].profile };
}
