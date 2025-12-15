ALTER TABLE "userSessions" ADD PRIMARY KEY ("sessionKey");--> statement-breakpoint
CREATE INDEX "userIdIndex" ON "userSessions" USING btree ("userId");