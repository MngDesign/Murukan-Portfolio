

    // Stepper style- Data for each step (title + description)
    const stepData = [
        { title: "UX Audit", desc: "Understanding the Current State.The journey begins with a comprehensive UX audit that evaluates the existing product experience. This includes assessing usability gaps, visual inconsistencies, performance bottlenecks, and user pain points. The outcome is a clear understanding of what works, what doesn’t, and where the biggest opportunities lie. " },
        { title: "Strategic Proposal", desc: "Based on the audit insights, the UX designer prepares a proposal outlining recommended improvements.This includes:Scope of work, Timelines, Prioritization of tasks, Expected business outcomes. This step ensures alignment between stakeholders and the design strategy before execution begins." },
        { title: "Deep Analysis", desc: "To create meaningful solutions, a deeper analysis is conducted to understand user behavior, business requirements, and market context. This includes: User interviews & surveys, Competitor analysis, Task/workflow studies, Identifying user & business goals. The output informs key decisions with evidence instead of assumptions." },
        { title: "Information Architecture & Usability Enhancement", desc: "A clear and intuitive structure is developed to help users find information with ease. This phase ensures: Logical categorization, Reduced cognitive load, Optimized navigation. Improvements here directly enhance usability, reduce friction, and support faster decision-making." },
        { title: "Wireframes, Prototypes, & Design System", desc: "Next, ideas are translated into wireframes and interactive prototypes to visualize the experience. Key activities: Low high fidelity wireframes, Interactive prototypes, UI components & design systems, Visual design refinement. This stage ensures that stakeholders can validate flows early, making collaboration smoother and reducing development rework." },
        { title: "Development Handover & Support", desc: "Designs are then translated into technical assets for development. This includes: Detailed specifications, Design tokens & component guidelines, Cross-functional collaboration. The UX designer supports engineering teams throughout implementation to ensure the final product matches the intended experience." },
        { title: "Usability Testing & Iterations", desc: "Once released, the product is tested with real users to validate its performance. Activities include: Remote/in-person usability tests, Analytics & behavioural tracking, Identifying pain points & areas of improvement. Findings guide iterative improvements, ensuring the product continues to evolve with user needs and business goals." }
    ];

    const steps = document.querySelectorAll('.step');
    const panel = document.getElementById('contentPanel');

    steps.forEach(step => {
        step.addEventListener('click', () => {
            // Remove active class from all
            steps.forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active'));

            // Add active to clicked
            step.classList.add('active');

            // Update panel
            const idx = step.dataset.index;
            panel.innerHTML = `
                <div class="content-title">${stepData[idx].title}</div>
                <div class="content-desc">${stepData[idx].desc}</div>
            `;
            panel.classList.add('active');
        });
    });

    // Initialise first step (already active in HTML)
    panel.innerHTML = `
        <div class="content-title">${stepData[0].title}</div>
        <div class="content-desc">${stepData[0].desc}</div>
    `;