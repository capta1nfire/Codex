"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Profile from './components/profile';
import GeneratedCodes from './components/generated-codes';
import Plans from './components/plans';
import APITokens from './components/api-tokens';

const UserPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="generatedCodes">Generated Codes</TabsTrigger>
          <TabsTrigger value="plans">Plans & Payments</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Profile />
        </TabsContent>
        <TabsContent value="generatedCodes">
          <GeneratedCodes />
        </TabsContent>
        <TabsContent value="plans">
          <Plans />
        </TabsContent>
        <TabsContent value="api">
          <APITokens />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserPage;