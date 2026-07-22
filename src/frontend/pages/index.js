import { useEffect, useMemo, useState } from 'react';

const COMPANY_ID = '11111111-1111-1111-1111-111111111111';
const API_URL = '';

const galleryImages = [
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80',
];

function parseUtcDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const hasTimeZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(value);
    return new Date(hasTimeZone ? value : `${value}Z`);
  }
  return new Date(value);
}

export default function Home() {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!COMPANY_ID) return;

    setDate(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/companies/${COMPANY_ID}/services`);
        if (!res.ok) throw new Error(`Services konnten nicht geladen werden (${res.status})`);
        const data = await res.json();
        setServices(data);
        if (data.length > 0) setServiceId(data[0].id);
      } catch (e) {
        setError(e.message || 'Services konnten nicht geladen werden.');
      }
    })();
  }, []);

  async function loadSlots() {
    setError('');
    setMessage('');
    setSuccess('');
    setSlots([]);
    setSelectedSlot('');

    if (!serviceId || !date) return;

    setLoadingSlots(true);
    try {
      const response = await fetch(
        `${API_URL}/api/public/companies/${COMPANY_ID}/availability?serviceId=${serviceId}&date=${date}T00:00:00Z`
      );
      if (!response.ok) {
        let messageText = `Verfügbarkeit konnte nicht geladen werden (${response.status})`;
        try {
          const payload = await response.json();
          messageText = payload.message || messageText;
        } catch (_) {}
        throw new Error(messageText);
      }

      const data = await response.json();
      const available = data.availableStartTimesUtc || [];
      setSlots(available);
      setSelectedSlot(available[0] || '');
      if (available.length === 0) {
        setMessage('Keine freien Slots für dieses Datum. Bitte ein anderes Datum wählen oder 24h Vorlauf beachten.');
      }
    } catch (e) {
      setError(e.message || 'Verfügbarkeit konnte nicht geladen werden.');
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    if (serviceId && date) {
      loadSlots();
    }
  }, [serviceId, date]);

  async function bookAppointment() {
    setError('');
    setMessage('');
    setSuccess('');

    if (!serviceId || !selectedSlot || !customerName.trim() || !customerEmail.trim()) {
      setError('Bitte Leistung, Uhrzeit, Name und E-Mail ausfüllen.');
      return;
    }

    setBookingLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/public/companies/${COMPANY_ID}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          startTimeUtc: parseUtcDate(selectedSlot).toISOString(),
          customerName,
          customerEmail,
          customerPhone,
          notes,
        }),
      });

      if (!response.ok) {
        let messageText = `Buchung fehlgeschlagen (${response.status})`;
        try {
          const payload = await response.json();
          messageText = payload.message || messageText;
        } catch (_) {}
        throw new Error(messageText);
      }

      const result = await response.json();
      setSuccess(`Termin erfolgreich gebucht. ID: ${result.appointmentId}`);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setNotes('');
      await loadSlots();
    } catch (e) {
      setError(e.message || 'Buchung konnte nicht ausgeführt werden.');
    } finally {
      setBookingLoading(false);
    }
  }

  const featuredServices = useMemo(() => services.slice(0, 3), [services]);

  return (
    <main>
      <header className="topbar">
        <div className="brand">ATELIER BOOKING</div>
        <nav>
          <a href="#leistungen">Leistungen</a>
          <a href="#atelier">Atelier</a>
          <a href="#galerie">Galerie</a>
        </nav>
        <a href="#buchung" className="btn-outline">Termin buchen</a>
      </header>

      <section className="hero fade-in">
        <div className="hero-content">
          <p className="overline">Luxury Editorial Minimalism</p>
          <h1>Ruhige Ästhetik. Präzise Termine. Premium Erlebnis.</h1>
          <p className="lead">
            Stilvolle Terminbuchung für ein hochwertiges Atelier-Erlebnis – klar, elegant und vertrauensvoll.
          </p>
          <div className="hero-actions">
            <a href="#buchung" className="btn-outline">Termin buchen</a>
            <a href="#leistungen" className="text-link">Mehr erfahren</a>
          </div>
        </div>
        <div className="hero-image" role="img" aria-label="Editorial Studio" />
      </section>

      <section className="positioning fade-in">
        <p>
          Wir verbinden hochwertige Behandlung mit präziser, digitaler Terminführung – reduziert auf das Wesentliche,
          mit Fokus auf Qualität, Ruhe und persönliche Betreuung.
        </p>
      </section>

      <section id="leistungen" className="section fade-in">
        <div className="section-head">
          <p className="overline">Leistungsbereiche</p>
          <h2>Wenige Schwerpunkte, starke Wirkung</h2>
        </div>
        <div className="services-grid">
          {featuredServices.length > 0 ? (
            featuredServices.map((service) => (
              <article key={service.id} className="service-card">
                <h3>{service.name}</h3>
                <p>{service.description || 'Exklusive Behandlung mit klaren Abläufen und individueller Betreuung.'}</p>
                <span>{service.durationMinutes} Minuten</span>
              </article>
            ))
          ) : (
            <article className="service-card">
              <h3>Premium Service</h3>
              <p>Leistungen werden geladen. Bitte einen Moment Geduld.</p>
              <span>—</span>
            </article>
          )}
        </div>
      </section>

      <section id="atelier" className="section atelier fade-in">
        <div className="atelier-image" role="img" aria-label="Atelier Innenraum" />
        <div>
          <p className="overline">Über uns</p>
          <h2>Ein Atelier mit Haltung</h2>
          <p>
            Unser Anspruch ist ein ruhiger, hochwertiger Rahmen für persönliche Beratung und exzellente Ergebnisse.
            Jeder Termin ist klar strukturiert und zugleich individuell.
          </p>
        </div>
      </section>

      <section id="galerie" className="section fade-in">
        <div className="section-head">
          <p className="overline">Galerie</p>
          <h2>Kuratiert statt überladen</h2>
        </div>
        <div className="gallery-grid">
          {galleryImages.map((src, i) => (
            <div key={src} className="gallery-item" style={{ backgroundImage: `url(${src})` }} aria-label={`Referenz ${i + 1}`} />
          ))}
        </div>
      </section>

      <section className="section proof fade-in">
        <p className="overline">Vertrauen</p>
        <h2>Empfohlen von anspruchsvollen Kundinnen und Kunden</h2>
        <p className="proof-copy">Diskret. Professionell. Konsistent hochwertig.</p>
      </section>

      <section id="buchung" className="section booking fade-in">
        <div className="section-head">
          <p className="overline">Abschluss</p>
          <h2>Termin elegant buchen</h2>
        </div>

        <div className="booking-shell">
          <div className="booking-controls">
            <label>
              Leistung
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes} Min)
                  </option>
                ))}
              </select>
            </label>

            <label>
              Datum
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>

          {error && <p className="feedback error">{error}</p>}
          {message && <p className="feedback note">{message}</p>}
          {success && <p className="feedback success">{success}</p>}
          {loadingSlots && <p className="feedback note">Verfügbarkeiten werden geladen...</p>}

          {slots.length > 0 && (
            <>
              <div>
                <p className="overline small">Uhrzeit</p>
                <div className="slots-wrap">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`slot ${selectedSlot === slot ? 'active' : ''}`}
                    >
                      {parseUtcDate(slot).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </button>
                  ))}
                </div>
              </div>

              <div className="booking-form">
                <input placeholder="Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                <input placeholder="E-Mail" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                <input placeholder="Telefon" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                <textarea placeholder="Notizen" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <button className="btn-outline" type="button" onClick={bookAppointment} disabled={!selectedSlot || bookingLoading}>
                  {bookingLoading ? 'Wird gebucht...' : 'Termin buchen'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <style jsx>{`
        main {
          padding: var(--space-4);
        }

        .topbar {
          max-width: 1200px;
          margin: 0 auto var(--space-5);
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: var(--space-3);
          border-bottom: 1px solid var(--color-border-soft);
          padding-bottom: 18px;
        }

        .brand {
          font-size: 12px;
          letter-spacing: 0.18em;
        }

        nav {
          display: flex;
          gap: 22px;
          justify-content: center;
        }

        nav a,
        .text-link {
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .btn-outline {
          justify-self: end;
        }

        .hero {
          max-width: 1200px;
          margin: 0 auto;
          min-height: 76vh;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 52px;
          align-items: center;
        }

        .hero-content h1,
        h2,
        h3 {
          font-weight: 500;
          line-height: 1.06;
          margin: 0;
        }

        .hero-content h1 {
          font-size: clamp(42px, 8vw, 78px);
          margin: 14px 0 22px;
        }

        .lead,
        p {
          line-height: 1.7;
          color: var(--color-text-secondary);
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 22px;
          margin-top: 28px;
        }

        .hero-image {
          width: 100%;
          height: min(72vh, 780px);
          background-image: url('https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1600&q=80');
          background-size: cover;
          background-position: center;
          filter: saturate(0.7) contrast(1.03);
        }


        .small {
          margin-bottom: 8px;
        }

        .section,
        .positioning {
          max-width: 1200px;
          margin: 110px auto 0;
        }

        .positioning {
          max-width: 740px;
          text-align: center;
          font-size: 20px;
          font-family: Georgia, 'Times New Roman', serif;
          line-height: 1.8;
        }

        .section-head {
          margin-bottom: 28px;
        }

        h2 {
          font-size: clamp(34px, 5vw, 58px);
          margin-top: 10px;
        }

        h3 {
          font-size: 34px;
          margin-bottom: 12px;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }

        .service-card {
          border-top: 1px solid var(--color-border-strong);
          padding-top: 20px;
          min-height: 210px;
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: 10px;
        }

        .service-card span {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .atelier {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }

        .atelier-image {
          min-height: 460px;
          background-image: url('https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1600&q=80');
          background-size: cover;
          background-position: center;
          filter: saturate(0.7);
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .gallery-item {
          min-height: 380px;
          background-size: cover;
          background-position: center;
          filter: grayscale(0.15);
        }

        .proof {
          text-align: center;
          max-width: 800px;
        }

        .proof-copy {
          font-size: 18px;
          letter-spacing: 0.05em;
        }

        .booking-shell {
          border: 1px solid var(--color-border-mid);
          padding: 28px;
          background: var(--color-surface);
          display: grid;
          gap: 20px;
        }

        .booking-controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        label {
          display: grid;
          gap: 8px;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #4b4b49;
        }

        .slots-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .slot {
          border: 1px solid #bfbfba;
          padding: 8px 11px;
          background: var(--color-white);
          font-size: 12px;
          cursor: pointer;
        }

        .slot.active {
          border-color: var(--color-border-strong);
          background: var(--color-text);
          color: var(--color-white);
        }

        .booking-form {
          display: grid;
          gap: 10px;
          max-width: 560px;
        }

        .booking-form .btn-outline {
          justify-self: start;
        }


        .fade-in {
          animation: fadeInUp 500ms ease both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 980px) {
          .topbar {
            grid-template-columns: 1fr;
            justify-items: center;
            text-align: center;
          }

          .btn-outline {
            justify-self: center;
          }

          .hero,
          .atelier,
          .services-grid,
          .gallery-grid,
          .booking-controls {
            grid-template-columns: 1fr;
          }

          .hero {
            min-height: auto;
            gap: 24px;
          }

          .hero-image,
          .atelier-image {
            min-height: 300px;
            height: 44vh;
          }

          .section,
          .positioning {
            margin-top: 78px;
          }

          .positioning {
            font-size: 18px;
          }
        }
      `}</style>
    </main>
  );
}
