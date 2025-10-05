// src/appwrite.js
import { Client, Account, Databases, Functions, Query } from "appwrite";

export const client = new Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("68dfb9df003bba1d6711"); // Find this in your Appwrite project settings

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export { ID, Query } from "appwrite";

export const realtimeClient = client;