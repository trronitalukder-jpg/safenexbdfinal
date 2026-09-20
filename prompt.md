অবশ্যই। আপনার ধারণাটাকে আমি কিছু বাদ না দিয়ে, বরং যেখানে business logic, security, admin control, wallet/hold system, transaction flow, bidding, CMS, SEO এবং audit দরকার সেখানে আরও পরিষ্কার করে একটি AI-ready complete software specification / master prompt হিসেবে সাজিয়ে দিচ্ছি।
এটি আপনি Cursor, Claude Code, ChatGPT, Gemini বা অন্য coding AI-কে দিতে পারবেন।
Safe Transaction Marketplace — Complete Software Specification
1. Project Overview
একটি professional Safe Transaction Marketplace & Digital/Physical Product Platform তৈরি করতে হবে।
Technology Stack:
Frontend: Next.js
Backend: NestJS
Database: MySQL
ORM: Prisma
Authentication: JWT + Refresh Token
API: REST API
Realtime: WebSocket / Socket.IO
File Storage: configurable local/S3-compatible storage
Rich Text Editor: Tiptap / similar professional editor
UI: Tailwind CSS + professional component system
Validation: Zod / class-validator
State Management: Zustand / React Query
Charts: Recharts / equivalent
Deployment: VPS-ready
Architecture: scalable modular architecture
System must be production-ready, secure, responsive and configurable.

2. Core Concept
এই website-এর মূল উদ্দেশ্য হলো:
Buyer এবং Seller-এর মধ্যে নিরাপদ transaction করার জন্য একটি মধ্যস্থতা platform তৈরি করা।
একজন user একই সাথে:
Buyer
Seller
Service Provider
Service Receiver
Physical Product Seller
Digital Product Seller
Product Buyer
Money Exchange participant
Transaction participant
হতে পারবে।
অর্থাৎ আলাদা buyer account এবং seller account থাকবে না।
একই User Account থেকে সব কাজ করা যাবে।
Transaction-এর ক্ষেত্রে user-এর role transaction অনুযায়ী পরিবর্তিত হবে।

3. Global Requirements
কোনো গুরুত্বপূর্ণ business logic hardcode করা যাবে না।
সব configuration admin panel থেকে পরিবর্তনযোগ্য হতে হবে।
যেমন:
Commission
Product commission
Transaction commission
Category
Subcategory
Bid minimum
Bid increment
Working time
Warning time
Withdrawal rules
Recharge accounts
Payment methods
CMS
SEO
Homepage
Slider
Header
Footer
Navigation
Site settings

4. Language System
Website পুরোপুরি multilingual হবে।
Default:
Bangla
Language toggle:
বাংলা | English
সব dynamic content-এর translation support থাকবে যেখানে প্রয়োজন।
যেমন:
Category
Product
CMS
Menu
Button
System message
Notification
Admin settings
Database architecture future multilingual support-এর জন্য প্রস্তুত রাখতে হবে।

5. Theme System
Website-এ:
Light Mode
Dark Mode
থাকবে।
User নিজের preference অনুযায়ী theme পরিবর্তন করতে পারবে।
System:
Responsive
Mobile
Tablet
Laptop
Desktop
Large monitor
সব screen size-এ properly কাজ করতে হবে।

6. Design
Design হবে:
Premium
Modern
Professional
Clean
Trust-focused
Marketplace-style
Financial-platform-style UI
Avoid:
অতিরিক্ত animation
unnecessary gradients
childish UI
cluttered dashboard
Use:
clean cards
proper spacing
professional typography
clear status badges
consistent buttons
confirmation dialogs
skeleton loaders
toast notifications
empty states
error states

7. Registration
User registration fields:
Required
First Name
Last Name
Profile Picture
Mobile Number
Email/Gmail
Address
Password
Confirm Password
Optional future fields:
Date of Birth
Country
City
Postal Code
Business Name
Business Type

8. Unique User ID
Registration সফল হলে system automatically unique User ID generate করবে।
Format:
FirstName + Last 4 Digit of Phone
Example:
Rahim2345
যদি duplicate হয়:
Rahim2345A
Rahim2345B
অথবা system unique suffix generate করবে।
User ID manually duplicate করা যাবে না।
User নিজের User ID পরিবর্তন করতে পারবে না, তবে admin প্রয়োজন হলে controlled modification করতে পারবে।

9. User Search
Strong user search system থাকবে।
Search by:
User ID
Name
Phone Number
Email/Gmail
Filters:
Active
Inactive
Verified
Seller
Buyer
Transaction activity
Wallet balance range
Registration date
Search result-এ:
Profile picture
Name
User ID
Verification status
Basic public information
Chat button
দেখাবে।
Privacy অনুযায়ী sensitive information public করা যাবে না।

10. User Profile
প্রতিটি user-এর public profile থাকবে।
Profile:
Profile picture
Name
User ID
Join date
Verification status
Products
Transaction-related public information
Reviews/ratings — future-ready
Profile থেকে:
Chat
button থাকবে।

11. Wallet System
প্রতিটি user-এর financial wallet থাকবে।
Wallet-এর মধ্যে আলাদা balance রাখতে হবে।
Available Balance
User transaction/payment-এর জন্য ব্যবহার করতে পারবে।
Hold Balance
Transaction completion process-এর সময় temporarily locked money।
Hold balance:
Withdraw করা যাবে না
অন্য transaction-এ ব্যবহার করা যাবে না
Admin controlled release হবে

12. Wallet Ledger
শুধু wallet_balance field দিয়ে system তৈরি করা যাবে না।
Proper wallet ledger system করতে হবে।
প্রতিটি transaction-এর জন্য:
Transaction ID
User ID
Type
Amount
Commission
Balance Before
Balance After
Reference
Status
Created At
Updated At
রাখতে হবে।
এতে financial audit সম্ভব হবে।

13. Recharge System
User dashboard:
Recharge
button থাকবে।
Recharge page-এ admin-configured payment methods দেখাবে।
যেমন:
bKash
Nagad
Rocket
Bank
Personal
Merchant
API
অন্যান্য payment method
Admin যেগুলো active করবে শুধু সেগুলো user দেখতে পাবে।

14. Recharge Request
User:
Amount লিখবে
যে number/account থেকে টাকা পাঠিয়েছে সেটি দিবে
Transaction ID দিবে
Payment method select করবে
Screenshot/proof upload করতে পারবে
Submit করবে
Status:
Pending
Approved
Rejected

15. Recharge Approval
Admin recharge request review করবে।
Admin দুইভাবে balance approve করতে পারবে:
Option 1
User যে amount claim করেছে সেটি approve করা।
Option 2
Admin manually approved amount লিখতে পারবে।
Example:
User request:
1000 BDT
Admin verified amount:
950 BDT
Approve করলে wallet-এ:
950 BDT
add হবে।
Rejected হলে:
balance add হবে না
rejection reason থাকবে

16. Withdrawal
User wallet-এর available balance থেকে withdrawal request করতে পারবে।
Withdrawal method:
bKash
Nagad
Rocket
Bank
Merchant
অন্যান্য configured method
User:
Amount
Account
Method
দিয়ে request করবে।
Admin:
Approve
Reject
Rejection reason
দিতে পারবে।

17. Important Wallet Rule
Hold balance withdraw করা যাবে না।
শুধু:
Available Balance
withdraw করা যাবে।

18. Product System
User নিজের dashboard থেকে product upload করতে পারবে।
Product types:
Physical Product
যেমন:
Smart device
Electronics
Accessories
অন্যান্য physical goods
Digital / Downloadable Product
যেমন:
Software
Ebook
Template
File
Digital service
Downloadable asset

19. Product Upload Fields
Required:
Title
Description
Image
Category
Product Type
Product type:
Physical
Downloadable
Images:
Multiple images
Image reorder
Image delete
Main image select

20. Product Title
Product title frontend-এ proper:
H1
হিসেবে render হবে।

21. Product Description Editor
Professional rich text editor থাকবে।
User পারবে:
Font size
Text color
Bold
Italic
Underline
Heading
Paragraph
Bullet
Number list
Link
Alignment
Quote
Table — optional
Image — optional
করতে পারবে।
Security-এর জন্য HTML sanitization বাধ্যতামূলক।

22. Product Category
Category/Subcategory শুধুমাত্র Admin তৈরি করতে পারবে।
User শুধু existing category select করতে পারবে।
Example:
Electronics
 ├── Smart Home
 ├── Mobile Accessories
 └── Computer Accessories

Digital Product
 ├── Software
 ├── Ebook
 └── Template

Services
 ├── Design
 ├── Development
 └── Marketing

Money Exchange
 ├── USD
 ├── EUR
 └── অন্যান্য
Category unlimited hierarchical structure support করবে।

23. Product SEO
প্রতিটি product-এর জন্য:
Meta Title
Meta Description
Meta Keywords
Slug
Canonical URL
OG Title
OG Description
OG Image
থাকবে।
SEO fields user/admin configuration অনুযায়ী ব্যবহার করতে পারবে।

24. Product Listing
নতুন product প্রথমে উপরে থাকবে।
Default sorting:
Newest → Oldest
Admin sorting override করতে পারবে।
Product card:
Main image
Product title
Seller profile picture
Seller name
Seller User ID
Category
Product type
Created date
Chat button
Bid button যেখানে applicable

25. Product Buy Button
সাধারণ:
Buy Now
থাকবে না।
Primary CTA হবে:
Chat
কারণ transaction আগে buyer ও seller আলোচনা করবে।

26. Chat System
Realtime chat system থাকবে।
Technology:
Socket.IO / WebSocket
Features:
One-to-one chat
Text message
Image
File
Message timestamp
Delivered
Seen
Reply
Delete where permitted
Block/report
Chat history

27. Transaction from Chat
Buyer/Seller chat করার পর agreement হলে:
Receiver/Seller নিজে payment request initiate করবে।
Example:
Rahim:
Provider
Karim:
Receiver
Rahim request করবে:
Pay Request = 500 BDT
Commission = 10%
Total Required = 550 BDT

28. Commission Calculation
Example:
Transaction amount:
500 BDT
Commission:
10%
Commission:
50 BDT
Required sender balance:
550 BDT
Sender-এর available balance ≥ 550 হলে request send করা যাবে।
না হলে:
Insufficient Balance
দেখাবে।

29. Commission Configuration
Admin commission configure করতে পারবে:
Physical Product Commission
Percentage
Flat
Digital Product Commission
Percentage
Flat
Transaction Commission
Percentage
Flat
Category-wise Commission
Percentage
Flat
Priority logic configurable হবে।
Default fallback:
Transaction-wise Commission
যদি specific commission configure না করা থাকে।

30. Receive Request
Receiver চাইলে:
Receive Request
দিতে পারবে।
Example:
Receive Request = 500 BDT
Sender request দেখবে:
Approve
Reject

31. Approval Rule
Approve করার সময় system check করবে:
Requested Amount + Applicable Commission
sender-এর available balance-এ আছে কিনা।
যদি থাকে:
Approved
দুই user-ই status দেখতে পাবে।
না থাকলে:
Insufficient Balance
দুইজনই দেখতে পাবে।

32. Reject
Receiver reject করলে:
Rejected
হবে।
কোনো balance transfer হবে না।
Receiver চাইলে নতুন request পাঠাতে পারবে।

33. Working Time
Request approve হওয়ার পর receiver:
Work Time
set করবে।
Example:
Start: 10:00 AM
End: 6:00 PM
অথবা:
Expected completion:
24 hours
Sender সেটা দেখতে পারবে।

34. Work Done
Receiver কাজ শেষ হলে:
Work Done Request
দেবে।
Status:
Work Completed - Awaiting Approval

35. Sender Approval
Sender দেখবে:
Work Done

Approve
Reject
Approve
Transaction amount sender-এর available balance থেকে deduct হয়ে receiver-এর Hold Balance-এ যাবে।
Commission accounting অনুযায়ী system ledger update করবে।
Reject
কোনো transfer হবে না।
Reject reason নেওয়া উচিত।

36. Hold Balance
Receiver-এর hold balance immediately withdraw করা যাবে না।
Admin review/approval পর্যন্ত থাকবে।
Example:
Receiver Available Balance: 1,000
Receiver Hold Balance: 500
Hold balance:
Withdraw করা যাবে না
New transaction-এ ব্যবহার করা যাবে না
Admin approval প্রয়োজন

37. Admin Hold Approval
Admin panel থেকে:
Hold Balance
manage করা যাবে।
Admin:
Approve
Reject
Release
Refund
Warning date
Warning time
Notes
দিতে পারবে।
Admin চাইলে:
Donor → Refund
অথবা
Receiver → Release
করতে পারবে।
সব action audit log-এ থাকবে।

38. Hold Warning
Admin hold balance-এর জন্য:
Warning Date
Warning Time
set করতে পারবে।
System automatic notification দিতে পারবে:
Your transaction is awaiting resolution.

39. Transaction Dispute / Admin Calling
কোনো transaction সমস্যা হলে user:
Call Admin
button চাপতে পারবে।
Admin panel-এ request আসবে।
Status:
Active Call
বর্তমানে active dispute/request।
Unresolved
লাল indicator।
Resolved
সবুজ indicator।
Hold Balance
হলুদ indicator।

40. Admin দেখতে পারবে
Dispute open হলে admin authorized view-তে দেখতে পারবে:
Sender
Receiver
Profile
User ID
Product
Transaction
Pay Request
Receive Request
Work Time
Work Done
Full chat history
Images
Files
Screenshots
Transaction status
Wallet ledger
Hold balance

41. Admin Transaction Intervention
প্রয়োজনে admin:
Approve Pay Request
Approve Work Done
Release Hold
Refund Sender
Credit Receiver
Cancel Transaction
করতে পারবে।
প্রতিটি manual admin action-এর:
Admin ID
Reason
Timestamp
Previous status
New status
Amount
audit করতে হবে।

42. Bidding / Product Position Promotion
Product listing default:
Newest first
কিন্তু seller চাইলে নিজের product-এর position promote করতে পারবে।
Dashboard-এ:
Bid
option থাকবে।
Minimum bid:
10 BDT
অথবা admin configurable amount।

43. Bid Example
Rahim-এর product বর্তমানে:
Position #20
সে:
Position #1
চায়।
যদি position #1-এ কোনো bid না থাকে:
10 BDT
দিয়ে bid করা যাবে।
যদি অন্য seller:
100 BDT
bid করে:
পরবর্তী valid bid:
101 BDT
হবে।

44. Bid Configuration
Admin configure করতে পারবে:
Minimum bid
Minimum increment
Position availability
Bid duration
Auto-expiry
Maximum positions
Category-specific bidding
Daily/weekly bidding

45. Smart Bid System
User:
Category
Position
Bid Amount
দিলে system calculate করবে:
Current Position
Current Highest Bid
Required Bid
এবং টাকা ↔ position উভয় direction-এ দেখাবে।
Example:
Position #1
Current Bid: 100
Your minimum bid: 101

46. Bid Wallet Rule
Bid করার আগে:
Available Balance
check করতে হবে।
Bid amount wallet থেকে reserve/hold করা উচিত যাতে একই টাকা অন্য transaction-এ ব্যবহার করা না যায়।
Bid lose করলে reserved amount release হবে।
Winning bid-এর amount system-defined rules অনুযায়ী deduct করবে।

47. Admin Dashboard
Admin dashboard professional analytics dashboard হবে।
Main cards:
Users
Total Users
Active Users
Inactive Users
New Users
Products
Total Products
Physical Products
Digital Products
Category-wise Products
Finance
Total Available Wallet Balance
Total Hold Balance
Total Transaction Volume
Total Commission
Total Bid Income
Total Recharge
Total Withdrawal
Transaction
Pending
Active
Completed
Rejected
Disputed
Hold

48. User Management
Admin:
Users
page থেকে সব user দেখতে পারবে।
Columns:
Profile
Name
User ID
Mobile
Email
Wallet Balance
Hold Balance
Product Count
Status
Registration Date
Actions

49. User Actions
Admin:
View Profile
Edit
Activate
Deactivate
Delete
Wallet Adjustment
Hold Adjustment
View Products
View Transactions
View Chats
View Recharge
View Withdrawal
করতে পারবে।
Financial adjustment-এর সময় reason বাধ্যতামূলক।

50. Product Management
Admin দেখতে পারবে:
All products
Pending products
Active products
Inactive products
Physical products
Digital products
Category
Seller
Reports
Admin:
Approve
Reject
Edit
Deactivate
Delete
Feature
Sort
করতে পারবে।

51. Category Management
Only admin:
Create category
Edit category
Delete category
Create subcategory
Reorder
Activate/deactivate
SEO settings
করতে পারবে।

52. Transaction Management
Admin দেখতে পারবে:
Transaction ID
Sender
Receiver
Amount
Commission
Total
Status
Created date
Work time
Hold amount
Dispute status
Filter:
Date
User
Amount
Category
Status
Transaction type

53. Commission Management
Admin page:
Commission Settings
থাকবে।
Configuration:
Global Transaction Commission
Physical Product Commission
Digital Product Commission
Category Commission
Commission type:
Percentage
Flat
Priority:
Category-specific
↓
Product-specific if enabled
↓
Transaction type
↓
Global default
সব configurable করতে হবে।

54. Admin Recharge Accounts
Admin payment account manage করবে।
Example:
bKash
Type: Personal
Number: XXXXX
Name: XXXXX
Status: Active
Bank
Bank Name
Account Name
Account Number
Branch
Routing
API
Future integration:
Provider
API credentials
Webhook
Status
Credentials encrypted রাখতে হবে।

55. Payment Method Management
Admin:
Add
Edit
Delete
Activate
Deactivate
Sort
করতে পারবে।
User শুধু active methods দেখতে পাবে।

56. CMS
Admin panel থেকে পুরো website manage করতে হবে।
Header
Edit:
Logo
Logo text
Site title
Header links
CTA
Mobile menu

57. Navigation
Navigation category-based হবে।
Admin category create করলে automatically navigation system-এ ব্যবহার করা যাবে।
Admin চাইলে:
Show
Hide
Reorder
করতে পারবে।

58. Hero Slider
Multiple slider support।
প্রতিটি slider:
Image
Title
Subtitle
Description
Button text
Button link
Status
Sort order
Admin:
Add
Edit
Delete
Activate
Deactivate
Reorder
করতে পারবে।

59. Homepage Builder
Homepage-এর main sections admin configurable হবে।
Sections:
Hero
Featured products
Latest products
Digital products
Physical products
Money exchange
Transaction marketplace
Categories
How it works
Trust/Safety
Statistics
CTA
Custom sections
Admin section:
Enable
Disable
Reorder
Edit
করতে পারবে।

60. Footer CMS
Admin:
Footer logo
Description
Contact
Address
Phone
Email
Social links
Quick links
Categories
Legal pages
Copyright
manage করতে পারবে।

61. Frontend Structure
Homepage:
Header
↓
Navigation
↓
Hero Slider
↓
Featured Categories
↓
Latest Products
↓
Digital Products
↓
Physical Products
↓
Money Exchange
↓
Transaction Marketplace
↓
How Safe Transaction Works
↓
Trust/Safety Section
↓
CTA
↓
Footer

62. Frontend Main Pages
প্রধান pages:
/
 /products
 /products/[slug]
 /digital-products
 /physical-products
 /money-exchange
 /transactions
 /categories/[slug]
 /users
 /users/[userId]
 /login
 /register
 /chat
 /dashboard

63. Transaction Marketplace Page
Transaction page-এ powerful search থাকবে।
Search:
Transaction type
User ID
User name
Category
Amount
Status

64. User Dashboard
Dashboard:
Profile
User ID
Wallet Balance
Hold Balance
Recharge
Withdraw
My Products
My Bids
Transactions
Messages
Notifications
Disputes
Profile Settings
Account Settings

65. Dashboard Wallet Card
Example:
Available Balance
৳ 5,000

Hold Balance
৳ 1,500

[Recharge] [Withdraw]

66. User Product Dashboard
User দেখতে পারবে:
All uploaded products
Active
Inactive
Pending
Rejected
Bidding
Position
প্রতিটি product-এর পাশে:
Edit
View
Deactivate
Bid

67. User Profile Settings
User update করতে পারবে:
Profile picture
Name
Address
Phone where policy permits
Email
Password
Notification preferences
Language
Theme
Payment accounts
User ID protected থাকবে।

68. Account Payment Settings
User multiple payout/recharge accounts save করতে পারবে।
Types:
bKash
Nagad
Rocket
Bank
Personal
Merchant
Other
প্রতিটি account-এর:
Account type
Number
Name
Bank details
Status
থাকবে।
Sensitive information encrypted/protected রাখতে হবে।

69. Notifications
Notification system থাকবে।
Notifications:
New message
Pay request
Receive request
Request approved
Request rejected
Work time
Work done
Hold balance
Hold released
Recharge
Withdrawal
Bid outbid
Bid won
Admin dispute
Security alert

70. Email/SMS-ready Architecture
System future-ready হবে:
Email Notification
SMS Notification
Push Notification
WhatsApp Notification
এর জন্য notification abstraction layer থাকবে।

71. Admin Calling Queue
Admin calling page:
ACTIVE
UNRESOLVED
RESOLVED
HOLD BALANCE
status অনুযায়ী আলাদা queue থাকবে।
User profile picture + name + user ID prominently দেখাবে।

72. Security
এই project-এর সবচেয়ে গুরুত্বপূর্ণ অংশ security।
Must implement:
Password hashing
JWT
Refresh token rotation
Role/permission guard
Rate limiting
CSRF protection where applicable
XSS protection
SQL injection protection through Prisma
Input validation
File type validation
File size validation
Secure upload
HTML sanitization
API authorization
Ownership checks
Wallet transaction locking
Idempotency
Audit logs
Login attempt protection
Session management

73. Financial Security
Wallet system-এর ক্ষেত্রে race condition prevent করতে হবে।
একই সময় দুইটি transaction হলে balance double spend হতে পারবে না।
Database transaction ব্যবহার করতে হবে।
যেমন:
BEGIN TRANSACTION
Lock wallet
Validate balance
Create ledger
Update balance
Create transaction
COMMIT
Failure হলে:
ROLLBACK

74. Transaction State Machine
Transaction status arbitraryভাবে change করা যাবে না।
Example:
DRAFT
↓
REQUESTED
↓
APPROVED
↓
WORKING
↓
WORK_DONE
↓
HOLD
↓
ADMIN_REVIEW
↓
RELEASED
Alternative:
REJECTED
CANCELLED
DISPUTED
REFUNDED
State transition backend enforce করবে।
Frontend শুধু status দেখাবে।

75. Audit Log
Admin এবং financial action-এর জন্য audit log mandatory।
Log:
Who
What
When
Before
After
Reason
IP
User Agent
রাখতে হবে।

76. Admin Permission System
Future scalability-এর জন্য শুধু admin=true ব্যবহার না করে permission system তৈরি করতে হবে।
Roles:
Super Admin
Admin
Finance Admin
Support Admin
Content Admin
Moderator
Permissions:
USER_VIEW
USER_EDIT
WALLET_VIEW
WALLET_ADJUST
TRANSACTION_VIEW
TRANSACTION_APPROVE
HOLD_RELEASE
RECHARGE_APPROVE
WITHDRAW_APPROVE
CMS_EDIT
PRODUCT_MODERATE
CATEGORY_MANAGE

77. SEO System
Global SEO:
Site title
Meta description
Keywords
Robots
Sitemap
Canonical
Open Graph
Twitter card
Schema.org
Breadcrumb schema
Product schema
Organization schema
Next.js-এর metadata system ব্যবহার করতে হবে।
Dynamic:
Product SEO
Category SEO
User/Profile SEO where appropriate
CMS SEO

78. Analytics
Admin:
Visitors
Page views
Product views
Search
User registration
Product upload
Transaction
Conversion
track করতে পারবে।

79. Pixel + Server-Side Tracking
Architecture:
Browser
Meta Pixel
Google Analytics
অন্যান্য configured pixels
Server
Meta Conversions API
Server-side event tracking
Admin panel থেকে tracking IDs/configuration manage করা যাবে।

80. Search System
Product search অত্যন্ত powerful হতে হবে।
Search:
Product title
Description
Category
Seller name
User ID
Filters:
Category
Subcategory
Product type
Physical
Digital
Price
Date
Seller
Position
Featured
Sorting:
Newest
Oldest
Position
Most viewed

81. Product Position Logic
Default:
Newest product = top
Bid থাকলে:
Paid position
priority পাবে।
Position conflict backend bidding engine resolve করবে।

82. Digital Product
Digital product-এর জন্য:
Download file
File size
File type
Version
Download limit
Secure download URL
Expiration
Access control
future-ready রাখতে হবে।
Download URL public করা যাবে না।

83. Physical Product
Physical product-এর জন্য future-ready fields:
Stock
SKU
Weight
Dimensions
Delivery information
Shipping configuration
রাখার architecture থাকবে।

84. Money Exchange
Money Exchange আলাদা product category/type হিসেবে support করতে হবে।
যেমন:
USD Buy
USD Sell
EUR Buy
EUR Sell
তবে real-world regulated financial activity-এর ক্ষেত্রে applicable laws, payment-provider rules এবং licensing requirements অনুযায়ী implementation/configuration করতে হবে।
Platform-এর transaction engine generic থাকবে।

85. Transaction Without Product
User চাইলে কোনো product ছাড়াই transaction করতে পারবে।
Example:
Rahim ↔ Karim
Service / Work / Agreement
Chat থেকে transaction শুরু হবে।

86. Transaction Types
Database-এ transaction type রাখা হবে:
PHYSICAL_PRODUCT
DIGITAL_PRODUCT
SERVICE
MONEY_EXCHANGE
GENERAL_TRANSACTION
Future types add করা যাবে।

87. Transaction ID
প্রতিটি transaction-এর unique ID:
TXN-20260917-XXXXXXXX
জাতীয় format হতে পারে।
Unique constraint থাকবে।

88. Chat-to-Transaction Linking
প্রতিটি transaction-এর সাথে chat conversation link থাকবে।
Admin dispute হলে সেই transaction-এর associated conversation দেখতে পারবে।

89. Screenshot Evidence
User dispute-এর সময়:
Screenshot
Image
Document
File
submit করতে পারবে।
Evidence immutable/auditable storage design ব্যবহার করতে হবে।

90. Admin Dispute Resolution
Admin দেখতে পারবে:
Transaction
Chat
Evidence
Wallet
Ledger
User history
Previous disputes
তারপর policy অনুযায়ী resolution করবে।

91. Database Core Tables
প্রাথমিকভাবে database architecture:
users
user_profiles
user_payment_accounts

roles
permissions
role_permissions

categories
category_translations

products
product_images
product_files
product_translations

wallets
wallet_ledger
wallet_holds

recharge_methods
recharge_requests

withdrawal_methods
withdrawal_requests

conversations
conversation_participants
messages
message_attachments

transactions
transaction_items
transaction_status_history
transaction_requests
transaction_work_logs

disputes
dispute_evidence
dispute_actions

commissions
commission_rules

bids
bid_history
bid_reservations

notifications

admin_actions
audit_logs

cms_pages
cms_sections
sliders
menus
menu_items

seo_settings
tracking_settings

system_settings

92. Database Principles
Money fields:
DECIMAL
ব্যবহার করতে হবে।
Money-এর জন্য Float ব্যবহার করা যাবে না।
সব important tables:
createdAt
updatedAt
রাখবে।
Soft delete যেখানে দরকার:
deletedAt
ব্যবহার করতে হবে।

93. API Architecture
NestJS modules:
AuthModule
UsersModule
RolesModule
PermissionsModule
ProductsModule
CategoriesModule
WalletModule
RechargeModule
WithdrawalModule
TransactionsModule
ChatModule
DisputeModule
BidModule
CommissionModule
NotificationModule
CMSModule
SEOModule
AnalyticsModule
TrackingModule
AdminModule
UploadModule
SettingsModule

94. API Examples
Auth
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
Users
GET /users
GET /users/:id
GET /users/search
PATCH /users/profile
Products
POST /products
GET /products
GET /products/:slug
PATCH /products/:id
DELETE /products/:id
Wallet
GET /wallet
GET /wallet/ledger
Recharge
POST /recharge
GET /recharge
Withdrawal
POST /withdrawals
GET /withdrawals
Chat
POST /conversations
GET /conversations
GET /conversations/:id/messages
Realtime:
message:send
message:receive
message:seen
typing:start
typing:stop
Transaction
POST /transactions
POST /transactions/:id/pay-request
POST /transactions/:id/receive-request
POST /transactions/:id/approve
POST /transactions/:id/reject
POST /transactions/:id/work-done
POST /transactions/:id/dispute
Bids
POST /bids
GET /bids
GET /bids/:productId

95. Frontend Architecture
Next.js App Router ব্যবহার করতে হবে।
Structure:
app/
├── (public)/
├── auth/
├── products/
├── categories/
├── users/
├── transactions/
├── chat/
├── dashboard/
└── admin/
Components:
components/
├── ui
├── layout
├── product
├── chat
├── wallet
├── transaction
├── bid
├── admin
└── forms

96. Admin Sidebar
Professional sidebar:
Dashboard

Users
Products
Categories

Transactions
Disputes
Admin Calling

Wallet
Recharge Requests
Withdrawal Requests
Hold Balance

Commission
Bidding

CMS
 ├── Header
 ├── Navigation
 ├── Slider
 ├── Homepage
 ├── Footer
 └── Pages

SEO
Analytics
Tracking

Notifications

Settings
 ├── General
 ├── Payment Methods
 ├── Commission
 ├── Security
 ├── Language
 └── System

97. User Sidebar
Dashboard

My Profile
Search Users
Messages

My Products
Upload Product

Transactions
My Requests
Disputes

Wallet
 ├── Available Balance
 ├── Hold Balance
 ├── Recharge
 ├── Withdraw
 └── Ledger

My Bids

Notifications

Account Settings
Payment Accounts

Security
Logout

98. Admin Dashboard Visuals
Charts:
User growth
Product growth
Transaction volume
Commission income
Bid income
Recharge
Withdrawal
Hold balance
Category-wise products
Date filters:
Today
7 Days
30 Days
This Month
Last Month
Custom

99. Error Handling
Backend থেকে standard response format রাখতে হবে।
Example:
{
  "success": false,
  "message": "Insufficient balance",
  "code": "INSUFFICIENT_BALANCE"
}
Frontend user-friendly Bangla/English message দেখাবে।

100. Final Development Rule
AI developer-কে অবশ্যই:
আগে architecture তৈরি করতে হবে।
তারপর database schema।
তারপর API specification।
তারপর authentication।
তারপর wallet/ledger।
তারপর transaction engine।
তারপর chat।
তারপর product।
তারপর bidding।
তারপর admin।
তারপর CMS।
তারপর SEO।
তারপর analytics/tracking।
শেষে UI polish ও deployment।
একবারে পুরো project-এর হাজার হাজার line code generate করা যাবে না।
প্রতিটি module complete করে:
Database
↓
Backend
↓
API
↓
Frontend
↓
Validation
↓
Testing
এই sequence-এ implement করতে হবে।

101. সবচেয়ে গুরুত্বপূর্ণ Business Rule
AI যেন কোনো অবস্থাতেই নিচের rules bypass না করে:
Rule 1
User available balance-এর চেয়ে বেশি transaction করতে পারবে না।
Rule 2
Hold balance withdraw করা যাবে না।
Rule 3
Wallet update শুধুমাত্র backend-এর মাধ্যমে হবে।
Rule 4
Frontend থেকে balance amount পাঠিয়ে wallet balance overwrite করা যাবে না।
Rule 5
সব financial operation database transaction-এর মধ্যে হবে।
Rule 6
Duplicate payment/request prevent করতে idempotency ব্যবহার করতে হবে।
Rule 7
Admin manual balance adjustment করলে reason বাধ্যতামূলক।
Rule 8
Transaction status backend state machine enforce করবে।
Rule 9
User অন্য user-এর wallet modify করতে পারবে না।
Rule 10
Admin ছাড়া category create করা যাবে না।
Rule 11
User শুধু নিজের product edit করতে পারবে।
Rule 12
Admin dispute resolution audit log-এ থাকবে।
Rule 13
Chat evidence delete/modify করলে audit trail রাখতে হবে।
Rule 14
Sensitive payment credentials encrypted রাখতে হবে।
Rule 15
Financial amount কখনো JavaScript floating-point বা MySQL FLOAT-এ রাখা যাবে না; DECIMAL ব্যবহার করতে হবে।

102. Future-Ready Features
Architecture এমন হতে হবে যাতে পরে সহজে যোগ করা যায়:
Reviews
Ratings
Seller verification
KYC
Identity verification
Escrow-like transaction workflow
Coupon
Referral
Membership
Subscription
Premium seller
Seller badges
Product reviews
Report user
Report product
Fraud detection
Risk scoring
2FA
OTP
Email verification
SMS verification
AI customer support
AI dispute assistance
Automatic moderation
Payment gateway
Mobile app
PWA
Multi-country
Multi-currency
Multi-language

103. বিশেষভাবে AI Developer-এর জন্য নির্দেশনা
এই project-এর উদ্দেশ্য শুধু একটি সাধারণ e-commerce website বানানো নয়।
এটি হবে:
Marketplace + Safe Transaction + Wallet + Escrow-style Hold + Chat + Digital Product + Physical Product + Service Transaction + Money Exchange + Bidding Platform
তাই architecture এমনভাবে তৈরি করতে হবে যাতে কোনো module অন্য module-এর business logic নষ্ট না করে।
সব financial operation centralized Ledger/Wallet service-এর মাধ্যমে পরিচালিত হবে।
Client-side কখনো financial truth-এর source হবে না।
সব গুরুত্বপূর্ণ calculation:
Commission
Wallet
Hold
Bid
Transaction
Balance
Withdrawal
Recharge
Backend-এ calculate হবে।

Recommended project architecture
                   ┌─────────────────────┐
                    │      Next.js        │
                    │   Web Application   │
                    └──────────┬──────────┘
                               │
                         REST / WebSocket
                               │
                    ┌──────────▼──────────┐
                    │       NestJS        │
                    │    API Backend      │
                    └──────────┬──────────┘
                               │
       ┌───────────────────────┼────────────────────────┐
       │                       │                        │
 ┌─────▼─────┐          ┌──────▼──────┐         ┌──────▼──────┐
 │   Auth    │          │ Transaction │         │    Chat     │
 │   Users   │          │   Engine    │         │ WebSocket   │
 └───────────┘          └──────┬──────┘         └─────────────┘
                               │
                     ┌─────────▼─────────┐
                     │ Wallet + Ledger   │
                     │ Hold + Commission │
                     └─────────┬─────────┘
                               │
                        ┌──────▼──────┐
                        │    MySQL    │
                        │   Prisma    │
                        └─────────────┘
সবচেয়ে গুরুত্বপূর্ণ বিষয়
আপনার system-এ Wallet + Ledger + Hold + Transaction State Machine + Admin Dispute—এই ৫টি অংশ শুরু থেকেই সঠিকভাবে design করতে হবে। এগুলো পরে যোগ করলে বড় ধরনের data/security সমস্যা হতে পারে।
আর একটি গুরুত্বপূর্ণ পরিবর্তন আমি specification-এ ইচ্ছাকৃতভাবে করেছি: শুধু wallet balance আর hold balance update করার ব্যবস্থা না রেখে immutable financial ledger + database transaction + audit trail রাখা হয়েছে। আপনার Safe Transaction ধারণার জন্য এটি অত্যন্ত গুরুত্বপূর্ণ।

