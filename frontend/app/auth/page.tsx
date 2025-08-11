"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Mail, 
  Key, 
  ArrowRight, 
  CheckCircle, 
  Zap,
  Users,
  Lock
} from "lucide-react";
import Link from "next/link";
import { AuthDemo } from "@/components/auth/auth-demo";

export default function AuthPage() {
  const features = [
    {
      icon: Shield,
      title: "OAuth Integration",
      description: "Google, Microsoft, GitHub with refresh token support",
      path: "/auth/demo"
    },
    {
      icon: Mail,
      title: "Email & Password",
      description: "Secure email verification and password management",
      path: "/auth/email"
    },
    {
      icon: Key,
      title: "Account Management",
      description: "Profile updates, account linking, and security settings",
      path: "/auth/demo"
    },
    {
      icon: Lock,
      title: "Advanced Security",
      description: "Rate limiting, session management, and GDPR compliance",
      path: "/auth/demo"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold">Vevurn POS Authentication</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Complete Better Auth integration with TypeScript, OAuth providers, 
            email authentication, and advanced security features.
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="default">Better Auth v1.3+</Badge>
            <Badge variant="secondary">TypeScript</Badge>
            <Badge variant="outline">Production Ready</Badge>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href={feature.path}>
                  <Button variant="outline" size="sm" className="w-full group">
                    Try It Now
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-lg border">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">OAuth</div>
            <div className="text-sm text-muted-foreground">3 Providers</div>
          </div>
          
          <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-lg border">
            <div className="flex items-center justify-center mb-2">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">Email</div>
            <div className="text-sm text-muted-foreground">Verification</div>
          </div>
          
          <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-lg border">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">Secure</div>
            <div className="text-sm text-muted-foreground">Rate Limited</div>
          </div>
          
          <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-lg border">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">Fast</div>
            <div className="text-sm text-muted-foreground">TypeScript</div>
          </div>
        </div>

        {/* Main Demo */}
        <AuthDemo />

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Built with Better Auth, TypeScript, and modern security best practices
          </p>
        </div>
      </div>
    </div>
  );
}
