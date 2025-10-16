CREATE TYPE "public"."SubscriptionStatus" AS ENUM('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid');--> statement-breakpoint
CREATE TABLE "Subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"stripeCustomerId" text NOT NULL,
	"stripeSubscriptionId" text NOT NULL,
	"status" "SubscriptionStatus" NOT NULL,
	"currentPeriodEnd" timestamp with time zone,
	"cancelAt" timestamp with time zone,
	"cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Subscription_userId_unique" UNIQUE("userId"),
	CONSTRAINT "Subscription_stripeCustomerId_unique" UNIQUE("stripeCustomerId"),
	CONSTRAINT "Subscription_stripeSubscriptionId_unique" UNIQUE("stripeSubscriptionId")
);
