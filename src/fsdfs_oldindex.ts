import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('API работает');
});

app.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении пользователей' });
  }
});

app.post('/users', async (req: Request, res: Response) => {
  const { username, email } = req.body;
  try {
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
      },
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании пользователя' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
