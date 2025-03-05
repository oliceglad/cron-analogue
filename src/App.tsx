import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "./App.css";

const jobSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  schedule: z.string().min(1, "Расписание обязательно"),
  command: z.string().min(1, "Команда обязательна"),
});

type Job = z.infer<typeof jobSchema>;

const mockJobs: Job[] = [
  {
    name: "Backup DB",
    schedule: "0 2 * * *",
    command: "pg_dump db > backup.sql",
  },
  {
    name: "Clear Logs",
    schedule: "0 3 * * 0",
    command: "rm -rf /var/logs/*.log",
  },
];

function App() {
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const { register, handleSubmit, reset } = useForm<Job>({
    resolver: zodResolver(jobSchema),
  });

  const addJob = (newJob: Job) => {
    setJobs([...jobs, newJob]);
    setOpen(false);
    reset();
  };

  return (
    <div style={{ padding: "16px" }}>
      <button onClick={() => setOpen(true)}>Добавить задачу</button>
      <div style={{ marginTop: "16px" }}>
        {jobs.map((job, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ddd",
              padding: "8px",
              marginBottom: "8px",
            }}
          >
            <p>
              <strong>{job.name}</strong>
            </p>
            <p>Cron: {job.schedule}</p>
            <p>Команда: {job.command}</p>
          </div>
        ))}
      </div>
      {open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{ background: "#fff", padding: "16px", borderRadius: "8px" }}
          >
            <h2>Добавить задачу</h2>
            <form onSubmit={handleSubmit(addJob)}>
              <input
                {...register("name")}
                placeholder="Название"
                style={{ display: "block", marginBottom: "8px" }}
              />
              <input
                {...register("schedule")}
                placeholder="* * * * *"
                style={{ display: "block", marginBottom: "8px" }}
              />
              <input
                {...register("command")}
                placeholder="Команда"
                style={{ display: "block", marginBottom: "8px" }}
              />
              <button type="submit">Создать</button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ marginLeft: "8px" }}
              >
                Отмена
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
