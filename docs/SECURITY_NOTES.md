## 4) `docs/SECURITY_NOTES.md`


# Security Notes

## Do not ship with these defaults
- Token in URL query string (leaks easily)
- CORS wildcard on token-protected endpoints
- Accepting `conversationId` without verifying tenant ownership
- Public endpoint that returns embed tokens

## Required production changes
1) Replace query-string token with:
   - public key in embed URL → server-minted short-lived token
2) CORS: reflect only validated origin (Vary: Origin)
3) Verify conversation ownership on resume:
   - conversation.business_id must equal derived businessId
4) Token management:
   - authenticated dashboard routes for view/rotate
   - invalidate old token(s) on rotation
