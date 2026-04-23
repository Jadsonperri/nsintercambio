import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/app/comunidade")({ component: ComunidadePage });

type Post = {
  id: string;
  user_id: string;
  achievement_type: string;
  content: string;
  badge: string | null;
  created_at: string;
  profile?: { full_name: string; username: string; avatar_url: string | null } | null;
  likes_count: number;
  liked_by_me: boolean;
};

const TYPES = [
  { v: "accepted", l: "🏆 Aceito em faculdade" },
  { v: "applied", l: "📝 Apliquei" },
  { v: "english", l: "🌍 Evoluí no inglês" },
  { v: "savings", l: "💰 Progresso financeiro" },
  { v: "response", l: "💬 Recebi resposta" },
];

function ComunidadePage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("accepted");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: postsData } = await supabase
      .from("community_posts").select("*").order("created_at", { ascending: false }).limit(50);
    if (!postsData) { setLoading(false); return; }

    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    const { data: profs } = await supabase.from("profiles")
      .select("id, full_name, username, avatar_url").in("id", userIds);
    const profMap = new Map(profs?.map((p) => [p.id, p]) || []);

    const postIds = postsData.map((p) => p.id);
    const { data: likes } = await supabase.from("community_likes")
      .select("post_id, user_id").in("post_id", postIds);

    const enriched: Post[] = postsData.map((p) => {
      const postLikes = likes?.filter((l) => l.post_id === p.id) || [];
      return {
        ...p,
        profile: profMap.get(p.user_id) || null,
        likes_count: postLikes.length,
        liked_by_me: !!user && postLikes.some((l) => l.user_id === user.id),
      };
    });
    setPosts(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const createPost = async () => {
    if (!user || !content.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id, achievement_type: type, content: content.trim(),
    });
    setPosting(false);
    if (error) { toast.error("Erro ao publicar"); return; }
    toast.success("Conquista compartilhada!");
    setContent("");
    load();
  };

  const toggleLike = async (post: Post) => {
    if (!user) return;
    if (post.liked_by_me) {
      await supabase.from("community_likes").delete().eq("user_id", user.id).eq("post_id", post.id);
    } else {
      await supabase.from("community_likes").insert({ user_id: user.id, post_id: post.id });
    }
    load();
  };

  const initials = (name?: string | null) =>
    (name || "U").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comunidade</h1>
        <p className="text-muted-foreground mt-1">Compartilhe suas conquistas no caminho do intercâmbio</p>
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {initials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <select
            className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
            value={type} onChange={(e) => setType(e.target.value)}
          >
            {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </div>
        <Textarea
          placeholder="Conte sua conquista..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={500}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{content.length}/500</span>
          <Button onClick={createPost} disabled={posting || !content.trim()} className="bg-gradient-primary">
            {posting ? "Publicando..." : "Compartilhar"}
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="text-center text-muted-foreground py-8">Carregando feed...</div>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Nenhuma conquista ainda. Seja o primeiro a compartilhar!
        </Card>
      ) : (
        posts.map((post) => {
          const t = TYPES.find((x) => x.v === post.achievement_type);
          return (
            <Card key={post.id} className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={post.profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {initials(post.profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{post.profile?.full_name || "Usuário"}</div>
                  <div className="text-xs text-muted-foreground">
                    @{post.profile?.username} · {new Date(post.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                {t && <Badge variant="secondary">{t.l}</Badge>}
              </div>
              <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              <div className="flex items-center gap-4 pt-2 border-t">
                <button
                  onClick={() => toggleLike(post)}
                  className={`flex items-center gap-1.5 text-sm transition-smooth ${
                    post.liked_by_me ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${post.liked_by_me ? "fill-current" : ""}`} />
                  {post.likes_count}
                </button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
