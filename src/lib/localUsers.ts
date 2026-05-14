export interface LocalUser {
  id: string;
  name: string;
  createdAt: number;
}

const USERS_KEY = "invidious-local-users-v1";
const CURRENT_USER_KEY = "invidious-local-current-user-id-v1";

const createDefaultUser = (): LocalUser => ({
  id: "local-default",
  name: "ローカルユーザー",
  createdAt: Date.now(),
});

const readUsers = (): LocalUser[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [createDefaultUser()];
    const parsed = JSON.parse(raw) as LocalUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [createDefaultUser()];
    return parsed.filter((user) => user?.id && user?.name);
  } catch {
    return [createDefaultUser()];
  }
};

const writeUsers = (users: LocalUser[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getLocalUsers = (): LocalUser[] => {
  const users = readUsers();
  writeUsers(users);
  return users;
};

export const getCurrentLocalUser = (): LocalUser => {
  const users = getLocalUsers();
  const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
  const current = users.find((user) => user.id === currentUserId) ?? users[0];
  localStorage.setItem(CURRENT_USER_KEY, current.id);
  return current;
};

export const setCurrentLocalUser = (userId: string): LocalUser => {
  const users = getLocalUsers();
  const found = users.find((user) => user.id === userId) ?? users[0];
  localStorage.setItem(CURRENT_USER_KEY, found.id);
  return found;
};

export const createLocalUser = (name: string): LocalUser => {
  const users = getLocalUsers();
  const user: LocalUser = {
    id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || "ローカルユーザー",
    createdAt: Date.now(),
  };
  writeUsers([...users, user]);
  localStorage.setItem(CURRENT_USER_KEY, user.id);
  return user;
};

