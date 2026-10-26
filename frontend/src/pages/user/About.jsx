export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-farm-900">About Orion</h1>
      <p className="mt-4 leading-relaxed text-slate-600">
        Orion is Meerut's online farm-fresh products store. We help you order fresh fruits and
        vegetables easily — browse the catalogue, choose a delivery time slot, and your order arrives
        right at your doorstep, anywhere in Meerut. Pay online or choose cash on delivery.
      </p>
      <p className="mt-3 leading-relaxed text-slate-600">
        Our aim is simple: raise awareness of the benefits of eating fresh produce, support local
        farmers, and make healthy eating convenient for every household — no traffic jams, no queues,
        no carrying heavy bags.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ['🌱', 'Farm sourced', 'Produce is handpicked from local farms and quality-checked before dispatch.'],
          ['🚚', 'Doorstep delivery', 'Three delivery windows every day across Meerut — free delivery above ₹499.'],
          ['💚', 'Eat fresh, live well', 'We share nutrition tips and seasonal picks so your family eats better.'],
        ].map(([icon, title, text]) => (
          <div key={title} className="rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
            <p className="text-3xl">{icon}</p>
            <p className="mt-2 font-bold text-slate-800">{title}</p>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-slate-400">
        Orion began as a B.Tech project at ABSS Institute of Technology, Meerut (project by
        Pratibha Sharma &amp; Shubhnish Verma, guided by Dr. Gopindra Kumar) and is now rebuilt on the
        MERN stack — MongoDB, Express.js, React.js and Node.js.
      </p>
    </div>
  );
}
