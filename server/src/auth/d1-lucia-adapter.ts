import type { Adapter, DatabaseSession, DatabaseUser, UserId } from "lucia";

import type { D1QueryClient } from "../db/client.js";

interface TableNames {
  user: string;
  session: string;
}

type Row = Record<string, unknown>;

export class D1LuciaAdapter implements Adapter {
  private readonly userTable: string;
  private readonly sessionTable: string;

  constructor(
    private readonly client: D1QueryClient,
    tableNames: TableNames
  ) {
    this.userTable = escapeName(tableNames.user);
    this.sessionTable = escapeName(tableNames.session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.execute(`DELETE FROM ${this.sessionTable} WHERE id = ?`, [sessionId]);
  }

  async deleteUserSessions(userId: UserId): Promise<void> {
    await this.client.execute(`DELETE FROM ${this.sessionTable} WHERE user_id = ?`, [userId]);
  }

  async getSessionAndUser(
    sessionId: string
  ): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
    const [session, user] = await Promise.all([
      this.getSession(sessionId),
      this.getUserFromSessionId(sessionId)
    ]);
    return [session, user];
  }

  async getUserSessions(userId: UserId): Promise<DatabaseSession[]> {
    const rows = await this.client.getAll<Row>(
      `SELECT * FROM ${this.sessionTable} WHERE user_id = ?`,
      [userId]
    );
    return rows.map(transformIntoDatabaseSession);
  }

  async setSession(databaseSession: DatabaseSession): Promise<void> {
    const value = {
      id: databaseSession.id,
      user_id: databaseSession.userId,
      expires_at: Math.floor(databaseSession.expiresAt.getTime() / 1000),
      ...databaseSession.attributes
    };
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    const columns = entries.map(([key]) => escapeName(key));
    const placeholders = Array(columns.length).fill("?").join(", ");
    const values = entries.map(([, item]) => item);

    await this.client.execute(
      `INSERT INTO ${this.sessionTable} (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );
  }

  async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
    await this.client.execute(`UPDATE ${this.sessionTable} SET expires_at = ? WHERE id = ?`, [
      Math.floor(expiresAt.getTime() / 1000),
      sessionId
    ]);
  }

  async deleteExpiredSessions(): Promise<void> {
    await this.client.execute(`DELETE FROM ${this.sessionTable} WHERE expires_at <= ?`, [
      Math.floor(Date.now() / 1000)
    ]);
  }

  private async getSession(sessionId: string): Promise<DatabaseSession | null> {
    const row = await this.client.get<Row>(`SELECT * FROM ${this.sessionTable} WHERE id = ?`, [
      sessionId
    ]);
    return row ? transformIntoDatabaseSession(row) : null;
  }

  private async getUserFromSessionId(sessionId: string): Promise<DatabaseUser | null> {
    const row = await this.client.get<Row>(
      `SELECT ${this.userTable}.* FROM ${this.sessionTable} INNER JOIN ${this.userTable} ON ${this.userTable}.id = ${this.sessionTable}.user_id WHERE ${this.sessionTable}.id = ?`,
      [sessionId]
    );
    return row ? transformIntoDatabaseUser(row) : null;
  }
}

function transformIntoDatabaseSession(row: Row): DatabaseSession {
  const { id, user_id: userId, expires_at: expiresAtUnix, ...attributes } = row;
  return {
    id: String(id),
    userId: String(userId),
    expiresAt: new Date(Number(expiresAtUnix) * 1000),
    attributes
  };
}

function transformIntoDatabaseUser(row: Row): DatabaseUser {
  const { id, ...attributes } = row;
  return {
    id: String(id),
    attributes
  };
}

function escapeName(value: string): string {
  return `\`${value.replaceAll("`", "``")}\``;
}
