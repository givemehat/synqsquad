-- Seed 10 Talent Profiles for Supply-Side Discovery
INSERT INTO public.talent_profiles (id, user_id, display_name, email, headline, skills, looking_for, experience_level, bio, github, portfolio, linkedin, availability, visible)
VALUES ('prf-ananya-ai-01', 'usr-ananya-01', 'Ananya Iyer', 'ananya.iyer.ai@example.com', 'AI/ML Engineer & Latency Optimizer | Open for NeurIPS & Hackathons', '{"PyTorch","vLLM","CUDA","FastAPI","TensorRT"}', '{"research","hackathon"}', 'experienced', 'Pre-training LLM inference kernels and quantization pipelines. Looking for a research team exploring speculative decoding or an edge computer vision hackathon squad.', 'ananya-iyer', 'https://ananya-iyer.dev', 'https://linkedin.com/in/ananya-iyer-ai', 'open', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.talent_profiles (id, user_id, display_name, email, headline, skills, looking_for, experience_level, bio, github, portfolio, linkedin, availability, visible)
VALUES ('prf-dev-systems-02', 'usr-dev-02', 'Devansh Mehta', 'devansh.mehta.sys@example.com', 'Rust & Systems Programmer | Distributed Consensus & P2P', '{"Rust","Tokio","Raft","gRPC","PostgreSQL","Docker"}', '{"hackathon","project","startup"}', 'early-career', 'Built distributed key-value stores with Raft consensus. Looking to build high-throughput infra or secure Web3 indexing pipelines in upcoming weekend hackathons.', 'devansh-sys', NULL, 'https://linkedin.com/in/devanshmehta', 'open', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.talent_profiles (id, user_id, display_name, email, headline, skills, looking_for, experience_level, bio, github, portfolio, linkedin, availability, visible)
VALUES ('prf-priya-frontend-03', 'usr-priya-03', 'Priya Sundaram', 'priya.sundaram.ux@example.com', 'Product Engineer & UI Architect | Next.js, WebGL & Design Systems', '{"Next.js","TypeScript","TailwindCSS","Three.js","Figma"}', '{"hackathon","startup","project"}', 'experienced', 'Obsessed with 60fps micro-interactions, clean design systems, and rapid prototype delivery. 3x national hackathon finalist looking for strong backend collaborators.', 'priya-sundaram', 'https://priyasundaram.design', NULL, 'open', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.talent_profiles (id, user_id, display_name, email, headline, skills, looking_for, experience_level, bio, github, portfolio, linkedin, availability, visible)
VALUES ('prf-rahul-robotics-04', 'usr-rahul-04', 'Rahul Deshmukh', 'rahul.deshmukh.robotics@example.com', 'Robotics Researcher | ROS2, SLAM & Autonomous Navigation', '{"ROS2","C++","Python","Gazebo","SLAM","OpenCV"}', '{"research","hackathon"}', 'student', 'Master''s student working on multi-agent LiDAR SLAM for warehouse rovers. Seeking co-authors for robotics conferences or Smart India Hackathon hardware teams.', 'rahul-robotics', NULL, NULL, 'open', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.talent_profiles (id, user_id, display_name, email, headline, skills, looking_for, experience_level, bio, github, portfolio, linkedin, availability, visible)
VALUES ('prf-sarah-nlp-05', 'usr-sarah-05', 'Sarah Jenkins', 'sarah.jenkins.nlp@example.com', 'NLP & Clinical Informatics Researcher | BioBERT, RAG & Evaluation', '{"Python","Hugging Face","LangChain","Evaluation","LaTeX"}', '{"research","mentor"}', 'experienced', 'Focusing on clinical NLP hallucination benchmarks and healthcare domain fine-tuning. Happy to collaborate with clinicians and ML engineers on paper drafting.', 'sarah-jenkins-lab', NULL, 'https://linkedin.com/in/sarah-jenkins-nlp', 'open', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.talent_profiles (id, user_id, display_name, email, headline, skills, looking_for, experience_level, bio, github, portfolio, linkedin, availability, visible)
VALUES ('prf-kabir-web3-06', 'usr-kabir-06', 'Kabir Varma', 'kabir.varma.eth@example.com', 'Smart Contract Engineer & Auditor | Solidity & Zero Knowledge', '{"Solidity","Foundry","Circom","EVM","TypeScript"}', '{"hackathon","startup"}', 'early-career', 'Winner ETHGlobal Istanbul 2024. Building account abstraction infra and privacy-preserving credential protocols. Looking for frontend/backend teammates for ETHGlobal.', 'kabir-varma', NULL, NULL, 'open', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.talent_profiles (id, user_id, display_name, email, headline, skills, looking_for, experience_level, bio, github, portfolio, linkedin, availability, visible)
VALUES ('prf-tanvi-bioinfo-07', 'usr-tanvi-07', 'Tanvi Bhatt', 'tanvi.bhatt.bio@example.com', 'Computational Biologist | AlphaFold, Molecular Dynamics & R', '{"Python","Biopython","R","AlphaFold","Nextflow"}', '{"research","open"}', 'student', 'Analyzing protein-ligand binding pockets with molecular dynamics simulations. Open to research collaborations in structural biology and computational chemistry.', 'tanvi-bhatt', NULL, NULL, 'open', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.talent_profiles (id, user_id, display_name, email, headline, skills, looking_for, experience_level, bio, github, portfolio, linkedin, availability, visible)
VALUES ('prf-arjun-fullstack-08', 'usr-arjun-08', 'Arjun Nair', 'arjun.nair.dev@example.com', 'Full-Stack Builder & GenAI Hacker | Next.js, Node, Supabase', '{"Next.js","React","TypeScript","Node.js","Supabase","TailwindCSS"}', '{"hackathon","project","open"}', 'student', 'Rapid prototyper who can ship full-stack web applications in under 24 hours. Looking to join high-energy hackathon squads targeting developer tools or fintech.', 'arjun-nair-dev', 'https://arjunnair.me', 'https://linkedin.com/in/arjunnairdev', 'open', true)
ON CONFLICT (id) DO NOTHING;

