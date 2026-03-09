import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Plus, Sparkles, Copy, Trash2, Edit, Calendar, Send, ExternalLink, Image, Video, Link2, Hash, Library, BarChart3, Clock, CheckCircle, FileText, Linkedin, Facebook, Instagram, Twitter, Youtube, Globe } from "lucide-react";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "bg-[#0A66C2]", shareUrl: (text: string, url?: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url || "https://www.aicoachportal.com")}&summary=${encodeURIComponent(text)}` },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "bg-[#1877F2]", shareUrl: (text: string, url?: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || "https://www.aicoachportal.com")}&quote=${encodeURIComponent(text)}` },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]", shareUrl: () => "" },
  { id: "twitter", name: "X / Twitter", icon: Twitter, color: "bg-foreground", shareUrl: (text: string, url?: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}${url ? `&url=${encodeURIComponent(url)}` : ""}` },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "bg-[#FF0000]", shareUrl: () => "" },
  { id: "tiktok", name: "TikTok", icon: Globe, color: "bg-foreground", shareUrl: () => "" },
  { id: "pinterest", name: "Pinterest", icon: Globe, color: "bg-[#E60023]", shareUrl: (text: string, url?: string) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url || "https://www.aicoachportal.com")}&description=${encodeURIComponent(text)}` },
  { id: "threads", name: "Threads", icon: Globe, color: "bg-foreground", shareUrl: () => "" },
  { id: "whatsapp", name: "WhatsApp", icon: Globe, color: "bg-[#25D366]", shareUrl: (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}` },
];

const AI_PROMPTS = [
  "Promote my AI webinar",
  "Share a course launch announcement",
  "Create a motivational AI learning post",
  "Announce a new certification",
  "Share tips about prompt engineering",
];

type SocialPost = {
  id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  video_url: string | null;
  link_url: string | null;
  hashtags: string[];
  platforms: string[];
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
};

const SocialMediaHub = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("compose");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);

  // Compose form
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  useEffect(() => {
    if (user) loadPosts();
  }, [user]);

  const loadPosts = async () => {
    const { data } = await supabase
      .from("social_posts")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setPosts((data as any[]) || []);
    setLoading(false);
  };

  const resetForm = () => {
    setContent("");
    setTitle("");
    setLinkUrl("");
    setHashtags([]);
    setHashtagInput("");
    setSelectedPlatforms([]);
    setScheduleDate("");
    setScheduleTime("");
    setEditingPost(null);
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const generateAIPost = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const response = await supabase.functions.invoke("chatbot", {
        body: {
          message: `Generate a professional social media post for the following topic. Include relevant hashtags. Keep it under 280 characters for Twitter compatibility but also provide a longer version. Topic: ${aiPrompt}. Format: just the post text with hashtags at the end.`,
          history: [],
        },
      });
      if (response.data?.reply) {
        setContent(response.data.reply);
        // Extract hashtags
        const tagMatches = response.data.reply.match(/#(\w+)/g);
        if (tagMatches) {
          setHashtags(tagMatches.map((t: string) => t.replace("#", "")));
        }
        toast.success("AI post generated!");
      }
    } catch {
      toast.error("Failed to generate post. Try again.");
    }
    setAiLoading(false);
  };

  const savePost = async (status: "draft" | "scheduled" | "published") => {
    if (!content.trim()) {
      toast.error("Post content is required");
      return;
    }
    if (status === "published" && selectedPlatforms.length === 0) {
      toast.error("Select at least one platform to share");
      return;
    }

    const scheduledAt = scheduleDate && scheduleTime
      ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      : null;

    const postData = {
      user_id: user!.id,
      title: title || null,
      content,
      link_url: linkUrl || null,
      hashtags,
      platforms: selectedPlatforms,
      status,
      scheduled_at: status === "scheduled" ? scheduledAt : null,
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingPost) {
      ({ error } = await supabase.from("social_posts").update(postData as any).eq("id", editingPost.id));
    } else {
      ({ error } = await supabase.from("social_posts").insert(postData as any));
    }

    if (error) {
      toast.error("Failed to save post");
      return;
    }

    // If publishing, open share links
    if (status === "published") {
      const fullText = content + (hashtags.length ? "\n\n" + hashtags.map(t => `#${t}`).join(" ") : "");
      selectedPlatforms.forEach(pid => {
        const platform = PLATFORMS.find(p => p.id === pid);
        if (platform) {
          const url = platform.shareUrl(fullText, linkUrl || undefined);
          if (url) window.open(url, "_blank");
        }
      });
      toast.success("Share links opened! Complete posting on each platform.");
    } else {
      toast.success(status === "draft" ? "Draft saved!" : "Post scheduled!");
    }

    resetForm();
    loadPosts();
    if (dialogOpen) setDialogOpen(false);
  };

  const deletePost = async (id: string) => {
    await supabase.from("social_posts").delete().eq("id", id);
    setPosts(posts.filter(p => p.id !== id));
    toast.success("Post deleted");
  };

  const editPost = (post: SocialPost) => {
    setEditingPost(post);
    setContent(post.content);
    setTitle(post.title || "");
    setLinkUrl(post.link_url || "");
    setHashtags(post.hashtags || []);
    setSelectedPlatforms(post.platforms || []);
    setTab("compose");
  };

  const duplicatePost = (post: SocialPost) => {
    setContent(post.content);
    setTitle((post.title || "") + " (copy)");
    setLinkUrl(post.link_url || "");
    setHashtags(post.hashtags || []);
    setSelectedPlatforms(post.platforms || []);
    setEditingPost(null);
    setTab("compose");
    toast.success("Post duplicated — edit and save");
  };

  const resharePost = (post: SocialPost) => {
    const fullText = post.content + (post.hashtags?.length ? "\n\n" + post.hashtags.map(t => `#${t}`).join(" ") : "");
    (post.platforms || []).forEach(pid => {
      const platform = PLATFORMS.find(p => p.id === pid);
      if (platform) {
        const url = platform.shareUrl(fullText, post.link_url || undefined);
        if (url) window.open(url, "_blank");
      }
    });
  };

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === "published").length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
    drafts: posts.filter(p => p.status === "draft").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" /> Social Media Hub
          </h2>
          <p className="text-sm text-muted-foreground">Create posts and share across platforms</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <FileText className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Posts</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div><p className="text-2xl font-bold">{stats.published}</p><p className="text-xs text-muted-foreground">Published</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div><p className="text-2xl font-bold">{stats.scheduled}</p><p className="text-xs text-muted-foreground">Scheduled</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Edit className="h-8 w-8 text-muted-foreground" />
            <div><p className="text-2xl font-bold">{stats.drafts}</p><p className="text-xs text-muted-foreground">Drafts</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose" className="gap-1"><Plus className="h-3.5 w-3.5" /> Compose</TabsTrigger>
          <TabsTrigger value="library" className="gap-1"><Library className="h-3.5 w-3.5" /> Library</TabsTrigger>
          <TabsTrigger value="platforms" className="gap-1"><Share2 className="h-3.5 w-3.5" /> Platforms</TabsTrigger>
        </TabsList>

        {/* COMPOSE TAB */}
        <TabsContent value="compose" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{editingPost ? "Edit Post" : "Create New Post"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Title (optional)</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Internal label for this post" />
                </div>
                <div>
                  <Label className="text-xs">Post Content *</Label>
                  <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your post here..." rows={6} className="resize-none" />
                  <p className="mt-1 text-xs text-muted-foreground text-right">{content.length} characters {content.length > 280 && <span className="text-yellow-500">(Twitter limit: 280)</span>}</p>
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1"><Link2 className="h-3 w-3" /> Link URL</Label>
                  <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://www.aicoachportal.com/courses" />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1"><Hash className="h-3 w-3" /> Hashtags</Label>
                  <div className="flex gap-2">
                    <Input value={hashtagInput} onChange={e => setHashtagInput(e.target.value)} placeholder="Add hashtag" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addHashtag())} />
                    <Button variant="outline" size="sm" onClick={addHashtag}>Add</Button>
                  </div>
                  {hashtags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {hashtags.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setHashtags(hashtags.filter(t => t !== tag))}>
                          #{tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Platform selection */}
                <div>
                  <Label className="text-xs mb-2 block">Share To</Label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {PLATFORMS.map(p => {
                      const Icon = p.icon;
                      const selected = selectedPlatforms.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePlatform(p.id)}
                          className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs transition-all ${selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50"}`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Schedule (optional)</Label>
                  <div className="flex gap-2">
                    <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                    <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => savePost("published")} className="gap-1" disabled={!content.trim() || selectedPlatforms.length === 0}>
                    <Send className="h-4 w-4" /> Share Now
                  </Button>
                  {scheduleDate && scheduleTime && (
                    <Button variant="secondary" onClick={() => savePost("scheduled")} className="gap-1">
                      <Calendar className="h-4 w-4" /> Schedule
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => savePost("draft")} className="gap-1" disabled={!content.trim()}>
                    <FileText className="h-4 w-4" /> Save Draft
                  </Button>
                  {editingPost && (
                    <Button variant="ghost" onClick={resetForm}>Cancel Edit</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant Sidebar */}
            <div className="space-y-4">
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1"><Sparkles className="h-4 w-4 text-primary" /> AI Post Generator</CardTitle>
                  <CardDescription className="text-xs">Describe your topic and let AI create a post</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="E.g. Promote my AI webinar on prompt engineering" rows={3} className="resize-none text-sm" />
                  <Button size="sm" className="w-full gap-1" onClick={generateAIPost} disabled={aiLoading || !aiPrompt.trim()}>
                    <Sparkles className="h-3.5 w-3.5" /> {aiLoading ? "Generating..." : "Generate Post"}
                  </Button>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Quick prompts:</p>
                    {AI_PROMPTS.map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => setAiPrompt(prompt)}
                        className="block w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              {content && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm whitespace-pre-wrap">
                      {content}
                      {hashtags.length > 0 && (
                        <p className="mt-2 text-primary">{hashtags.map(t => `#${t}`).join(" ")}</p>
                      )}
                      {linkUrl && <p className="mt-1 text-xs text-blue-400 underline">{linkUrl}</p>}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* LIBRARY TAB */}
        <TabsContent value="library" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {["all", "draft", "scheduled", "published"].map(f => (
              <Badge key={f} variant="outline" className="cursor-pointer capitalize">{f}</Badge>
            ))}
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : posts.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Library className="mx-auto mb-3 h-10 w-10 opacity-50" />
                <p className="font-medium">No posts yet</p>
                <p className="text-sm">Create your first post in the Compose tab</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(post => (
                <Card key={post.id} className="border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {post.title && <p className="font-medium text-sm truncate">{post.title}</p>}
                        <Badge variant={post.status === "published" ? "default" : post.status === "scheduled" ? "secondary" : "outline"} className="text-xs mt-1">
                          {post.status}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editPost(post)}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicatePost(post)}><Copy className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePost(post.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
                    {post.hashtags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.hashtags.slice(0, 4).map(t => (
                          <span key={t} className="text-xs text-primary">#{t}</span>
                        ))}
                      </div>
                    )}
                    {post.platforms?.length > 0 && (
                      <div className="flex gap-1">
                        {post.platforms.map(pid => {
                          const pl = PLATFORMS.find(p => p.id === pid);
                          if (!pl) return null;
                          const Icon = pl.icon;
                          return <Icon key={pid} className="h-3.5 w-3.5 text-muted-foreground" />;
                        })}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => resharePost(post)}>
                        <ExternalLink className="h-3 w-3" /> Share Again
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* PLATFORMS TAB */}
        <TabsContent value="platforms" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Connected Platforms</CardTitle>
              <CardDescription>Connect accounts to share posts directly. Posts open the platform's share dialog pre-filled with your content.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PLATFORMS.map(p => {
                  const Icon = p.icon;
                  const hasShareUrl = !!p.shareUrl("test");
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${p.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{p.name}</p>
                        {hasShareUrl ? (
                          <div className="flex items-center gap-1 text-xs text-green-500">
                            <CheckCircle className="h-3 w-3" /> Share Ready
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Copy & Paste</p>
                        )}
                      </div>
                      {hasShareUrl ? (
                        <Badge variant="outline" className="text-xs border-green-500/30 text-green-500">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Manual</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                <p>Write your post content in the Compose tab, add hashtags and links</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                <p>Select the platforms you want to share on</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                <p>Click "Share Now" — each platform's share dialog opens pre-filled with your content</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">4</span>
                <p>Confirm and post on each platform. For Instagram/TikTok/YouTube, copy the text and paste it directly</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialMediaHub;
