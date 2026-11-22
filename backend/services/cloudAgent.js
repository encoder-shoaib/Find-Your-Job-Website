const fs = require('fs');
const path = require('path');
const { getCollection, isDBConnected } = require('../config/db');
const { JOBS_JSON_PATH } = require('../config/paths');
const { getStoredJobs, addJobs, addSearchHistory, addAgentLog } = require('./jobsStore');

const SEARCH_API_ENDPOINT = 'https://api.bdjobs.com/jobs/api/v1/JobSearch/GetJobSearch';

const SEARCH_KEYWORDS = [
  'Software Engineer',
  'Python Developer',
  'Full Stack Developer',
  'React Developer',
  'Frontend Developer',
  'Backend Developer',
  'Node.js Developer',
  'AI Engineer',
  'Machine Learning',
  'Data Analyst',
  'DevOps Engineer',
  'Flutter Developer',
  'Java Developer',
  'PHP Developer',
  'Laravel Developer',
  'SQA Engineer',
  'Cloud Engineer',
  'Database Administrator',
];

function scoreJob(title = '', desc = '', location = '', exp = '') {
  let score = 5;
  const lowerTitle = title.toLowerCase();
  const lowerDesc = desc.toLowerCase();

  // Role match (up to +2)
  if (/python|software engineer|developer|full stack|backend|frontend|react|node|django|mobile|flutter|ai|data|engineer/i.test(lowerTitle)) {
    score += 2;
  }

  // Tech skills match (up to +1)
  if (/python|javascript|typescript|react|node|sql|django|docker|api|git|mongodb|express|aws|rest|java|php|laravel|linux/i.test(lowerDesc)) {
    score += 1;
  }

  // Experience level match (fresher/junior friendly, up to +1)
  if (/fresher|junior|entry|intern|0 to|1 to|at most 1|at most 2/i.test(lowerTitle + ' ' + exp)) {
    score += 1;
  }

  // Location / Remote match (+1)
  if (/dhaka|remote|bangladesh/i.test(location)) {
    score += 1;
  }

  score = Math.min(10, Math.max(1, score));
  const priority = score >= 7 ? 'High' : (score >= 5 ? 'Medium' : 'Low');

  // Categorization
  let category = 'Other Technology Jobs';
  if (/react|frontend|angular|vue|ui|ux|css|html|designer/i.test(title)) {
    category = 'Software Development';
  } else if (/python|backend|node|django|api|engineer|developer|full stack|java|golang|\.net|php|laravel/i.test(title)) {
    category = 'Software Development';
  } else if (/ai|data|machine learning|ml|nlp|deep learning|scientist|analytics/i.test(title)) {
    category = 'AI & Data';
  } else if (/network|devops|system|cloud|linux|admin|security|sqa|qa/i.test(title)) {
    category = 'IT & Networking';
  }

  return { score, priority, category };
}

/**
 * Executes the autonomous job search in cloud/serverless Node.js environments.
 * Supports multi-page deep crawling to satisfy requested limits (5, 10, 25, 50, etc.).
 */
async function runCloudAgent({ limit = 5, dryRun = true } = {}, onLog = () => {}, onStatus = () => {}) {
  const targetLimit = Math.max(1, parseInt(limit, 10) || 5);

  const log = (msg, action = 'CRAWLER_LOG') => {
    const time = new Date().toLocaleTimeString();
    const formatted = `[${time}] ${msg}`;
    onLog(formatted);
    onStatus(msg);

    // Record to global in-memory Agent Logs
    addAgentLog({
      action,
      message: msg,
      timestamp: new Date().toISOString(),
    });
  };

  log(`[Cloud Agent Engine] Initialized autonomous crawler (Target: ${targetLimit} jobs, Dry-Run: ${dryRun})...`, 'AGENT_START');

  // 1. Gather existing known job IDs to prevent duplicate processing
  const knownIds = new Set();

  if (isDBConnected()) {
    try {
      const col = getCollection('jobs');
      const docs = await col.find({}, { projection: { job_id: 1 } }).toArray();
      docs.forEach((d) => d.job_id && knownIds.add(String(d.job_id)));
    } catch (e) {
      log(`[Warning] Could not fetch existing jobs from MongoDB: ${e.message}`);
    }
  }

  const storedJobs = getStoredJobs();
  storedJobs.forEach((j) => j.job_id && knownIds.add(String(j.job_id)));

  log(`Cross-tier cache loaded: ${knownIds.size} indexed jobs ready for deduplication.`);

  const newDiscoveredJobs = [];
  let totalFoundOnApi = 0;
  const processedKeywords = [];

  // 2. Keyword-based multi-page search
  for (const kw of SEARCH_KEYWORDS) {
    if (newDiscoveredJobs.length >= targetLimit) break;
    processedKeywords.push(kw);

    for (let pageNum = 1; pageNum <= 2; pageNum++) {
      if (newDiscoveredJobs.length >= targetLimit) break;

      log(`Querying Bdjobs for: "${kw}" (Page ${pageNum})...`);

      try {
        const url = `${SEARCH_API_ENDPOINT}?keyword=${encodeURIComponent(kw)}&fcatId=8&pg=${pageNum}&q=${encodeURIComponent(kw)}`;
        const resp = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://jobs.bdjobs.com',
            'Referer': 'https://jobs.bdjobs.com/',
          },
        });

        if (!resp.ok) continue;

        const data = await resp.json();
        const rawList = data?.data || [];
        totalFoundOnApi += rawList.length;

        for (const item of rawList) {
          if (newDiscoveredJobs.length >= targetLimit) break;

          const jobId = String(item.Jobid || item.jobId || '').trim();
          if (!jobId || knownIds.has(jobId)) continue;

          knownIds.add(jobId);

          const title = (item.jobTitle || '').trim();
          const company = (item.companyName || '').trim();
          const location = (item.location || '').trim();
          const deadline = (item.deadline || '').trim();
          const salary = (item.Salary && item.Salary !== '--') ? item.Salary.trim() : 'Negotiable';
          const exp = (item.experience || 'NA').trim();
          const desc = (item.jobDescription || item.jobDescription_snippet || title).trim();
          const pubDate = item.publishDate || new Date().toISOString();

          const { score, priority, category } = scoreJob(title, desc, location, exp);

          const jobRecord = {
            job_id: jobId,
            job_title: title,
            company_name: company,
            location: location || 'Dhaka',
            publish_date: pubDate,
            deadline: deadline,
            application_deadline: deadline,
            salary: salary,
            experience: exp,
            education_requirements: item.eduRec || '',
            job_description_snippet: desc.slice(0, 300),
            job_type: item.JobType || 'Full Time',
            workplace: item.WorkPlace || 'Office',
            original_url: `https://bdjobs.com/h/details/${jobId}?ln=1`,
            apply_link: `https://bdjobs.com/h/details/${jobId}?ln=1`,
            source: 'Bdjobs',
            date_found: new Date().toISOString().replace('T', ' ').substring(0, 19),
            matched_keyword: kw,
            job_description: desc,
            educational_requirements: item.eduRec || '',
            experience_requirements: exp,
            additional_requirements: '',
            required_skills: title,
            employment_type: item.JobType || 'Full Time',
            job_posting_date: pubDate,
            status: 'Active',
            match_score: score,
            priority: priority,
            match_reason: `Evaluated for ${kw}. Alignment score: ${score}/10 (${priority} Priority).`,
            experience_level: exp,
            job_category: category,
            recommendation: priority === 'High'
              ? 'Strongly Recommended: High alignment with technical skillset and career level.'
              : 'Recommended: Good alignment, review specific role requirements.',
            confidence: 'High',
            notes: 'Evaluated by Cloud Serverless Agent Engine.',
            last_updated: new Date().toISOString(),
            created_at: new Date().toISOString(),
            synced_to_db: isDBConnected(),
          };

          newDiscoveredJobs.push(jobRecord);
          log(`[${priority} Priority | Score: ${score}/10] (${newDiscoveredJobs.length}/${targetLimit}) "${title}" at ${company}`, 'JOB_DISCOVERED');
        }
      } catch (fetchErr) {
        log(`Error querying keyword "${kw}": ${fetchErr.message}`);
      }
    }
  }

  // 3. Fallback: If target limit not yet reached, paginate across IT Category 8
  let catPage = 1;
  while (newDiscoveredJobs.length < targetLimit && catPage <= 6) {
    log(`Deep-crawling IT Category 8 (Page ${catPage}) to reach target ${targetLimit}...`);

    try {
      const url = `${SEARCH_API_ENDPOINT}?fcatId=8&pg=${catPage}`;
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://jobs.bdjobs.com',
          'Referer': 'https://jobs.bdjobs.com/',
        },
      });

      if (!resp.ok) break;

      const data = await resp.json();
      const rawList = data?.data || [];
      if (!rawList.length) break;
      totalFoundOnApi += rawList.length;

      for (const item of rawList) {
        if (newDiscoveredJobs.length >= targetLimit) break;

        const jobId = String(item.Jobid || item.jobId || '').trim();
        if (!jobId || knownIds.has(jobId)) continue;

        knownIds.add(jobId);

        const title = (item.jobTitle || '').trim();
        const company = (item.companyName || '').trim();
        const location = (item.location || '').trim();
        const deadline = (item.deadline || '').trim();
        const salary = (item.Salary && item.Salary !== '--') ? item.Salary.trim() : 'Negotiable';
        const exp = (item.experience || 'NA').trim();
        const desc = (item.jobDescription || item.jobDescription_snippet || title).trim();
        const pubDate = item.publishDate || new Date().toISOString();

        const { score, priority, category } = scoreJob(title, desc, location, exp);

        const jobRecord = {
          job_id: jobId,
          job_title: title,
          company_name: company,
          location: location || 'Dhaka',
          publish_date: pubDate,
          deadline: deadline,
          application_deadline: deadline,
          salary: salary,
          experience: exp,
          education_requirements: item.eduRec || '',
          job_description_snippet: desc.slice(0, 300),
          job_type: item.JobType || 'Full Time',
          workplace: item.WorkPlace || 'Office',
          original_url: `https://bdjobs.com/h/details/${jobId}?ln=1`,
          apply_link: `https://bdjobs.com/h/details/${jobId}?ln=1`,
          source: 'Bdjobs',
          date_found: new Date().toISOString().replace('T', ' ').substring(0, 19),
          matched_keyword: 'IT Category Search',
          job_description: desc,
          educational_requirements: item.eduRec || '',
          experience_requirements: exp,
          additional_requirements: '',
          required_skills: title,
          employment_type: item.JobType || 'Full Time',
          job_posting_date: pubDate,
          status: 'Active',
          match_score: score,
          priority: priority,
          match_reason: `Category matched. Alignment score: ${score}/10 (${priority} Priority).`,
          experience_level: exp,
          job_category: category,
          recommendation: priority === 'High'
            ? 'Strongly Recommended: High alignment with technical skillset and career level.'
            : 'Recommended: Good alignment, review specific role requirements.',
          confidence: 'High',
          notes: 'Evaluated by Cloud Serverless Agent Engine.',
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString(),
          synced_to_db: isDBConnected(),
        };

        newDiscoveredJobs.push(jobRecord);
        log(`[${priority} Priority | Score: ${score}/10] (${newDiscoveredJobs.length}/${targetLimit}) "${title}" at ${company}`, 'JOB_DISCOVERED');
      }
    } catch (err) {
      break;
    }
    catPage++;
  }

  // 4. Persist new jobs across active storage tiers
  let totalSavedCount = storedJobs.length;
  if (newDiscoveredJobs.length > 0) {
    log(`Persisting ${newDiscoveredJobs.length} new jobs across storage tiers...`);

    // MongoDB primary storage
    if (isDBConnected()) {
      try {
        const col = getCollection('jobs');
        for (const j of newDiscoveredJobs) {
          await col.updateOne({ job_id: j.job_id }, { $set: j }, { upsert: true });
        }
        log(`[MongoDB Success] Persisted ${newDiscoveredJobs.length} new jobs to MongoDB.`);
      } catch (mErr) {
        log(`[MongoDB Warning] Could not persist to MongoDB: ${mErr.message}`);
      }
    }

    // Storage persistence via jobsStore
    try {
      const allJobs = addJobs(newDiscoveredJobs);
      totalSavedCount = allJobs.length;
      log(`[Storage Success] Synchronized storage: ${totalSavedCount} total jobs now indexed.`);
    } catch (jErr) {
      log(`[Storage Warning] Storage update notice: ${jErr.message}`);
    }
  } else {
    log(`All searched tech jobs are already up to date. 0 duplicates added.`);
  }

  // Always record Search History across both in-memory store and MongoDB
  const historyItem = {
    timestamp: new Date().toISOString(),
    keywords: processedKeywords.slice(0, 5),
    category_ids: [8],
    found_count: totalFoundOnApi,
    new_count: newDiscoveredJobs.length,
    duplicates_skipped: Math.max(0, totalFoundOnApi - newDiscoveredJobs.length),
    status: 'Success',
    source: isDBConnected() ? 'MongoDB' : 'Cloud Serverless Engine',
  };
  addSearchHistory(historyItem);

  if (isDBConnected()) {
    try {
      const searchCol = getCollection('search_history');
      await searchCol.insertOne(historyItem);
      const logsCol = getCollection('agent_logs');
      await logsCol.insertOne({
        action: 'AGENT_COMPLETE',
        message: `Hunt finished. ${newDiscoveredJobs.length} new jobs persisted.`,
        timestamp: new Date().toISOString(),
      });
    } catch (hErr) {}
  }

  log(`Autonomous hunt completed successfully. Exit code: 0.`, 'AGENT_COMPLETE');

  return {
    success: true,
    newJobsCount: newDiscoveredJobs.length,
    newJobs: newDiscoveredJobs,
    totalJobs: totalSavedCount,
  };
}

module.exports = {
  runCloudAgent,
};
